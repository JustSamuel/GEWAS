import { getLogger } from 'log4js';
import { Mailbox } from 'ts-mailcow-api';
import { mcc } from '../index';

/**
 * AliasType describes whether an alias relationship is a direct alias, a forward, or not yet set.
 */
export type AliasType = 'alias' | 'forward' | null;

/**
 * AliasEntry represents a single alias mapping,
 * where `from` is the source (alias/forward), and `type` describes the relation.
 */
type AliasEntry = { from: string; type: AliasType };

/**
 * AliasDictionary is the core in-memory structure.
 * It maps each email address to a list of its AliasEntries (aliases and forwards),
 * and records the last update time for TTL-based cache expiry.
 */
type AliasDictionary = {
  emails: {
    [key: string]: {
      aliases: AliasEntry[];
    };
  };
  last_update_time: Date;
};

/**
 * Alias is a recursive type that describes all addresses that eventually point to a given email,
 * potentially via chains of aliases and forwards. Used for full alias resolution output.
 */
type Alias = {
  to: string;
  from: null | Alias[];
  type: AliasType;
};

// --- Configurable cache expiry in ms (default: 1 hour) ---
const ALIAS_DICT_TTL = 60 * 60 * 1000;

/**
 * Core state: In-memory dictionary of all alias relationships,
 * refreshed from the Mailcow API as needed.
 */
const alias_dict: AliasDictionary = { emails: {}, last_update_time: new Date() };

// Mutex for preventing parallel refreshes (thundering herd)
let refreshInProgress = false;
let refreshPromise: Promise<void> | null = null;

// Logging setup
const logger = getLogger('aliasService');

/**
 * Adds a single alias or forward relationship to the dictionary.
 *
 * @param email - The destination email address (alias or forward target).
 * @param alias - The AliasEntry (who is pointing here, and by what method).
 */
function addAlias(email: string, alias: AliasEntry): void {
  if (Object.prototype.hasOwnProperty.call(alias_dict.emails, email)) {
    alias_dict.emails[email].aliases.push(alias);
  } else {
    alias_dict.emails[email] = { aliases: [alias] };
  }
}

/**
 * Fetches and rebuilds the entire alias_dict from the Mailcow API.
 * Populates direct aliases as well as forwards (from sieve filters).
 * Ensures no concurrent refreshes are run in parallel (mutex).
 *
 * @remarks
 * Uses async/await for all MailcowClient calls.
 * Catches and logs errors but always clears the refresh flag.
 */
export async function createAliasDictionary(): Promise<void> {
  if (refreshInProgress) {
    logger.info('Alias dictionary refresh already in progress. Awaiting...');
    if (refreshPromise != null) await refreshPromise;
    return;
  }
  refreshInProgress = true;
  refreshPromise = (async () => {
    try {
      logger.info('Creating Alias Dictionary.');
      alias_dict.last_update_time = new Date();
      alias_dict.emails = {};

      // --- Populate direct aliases ---
      try {
        const aliases = await mcc.aliases.get('all');
        aliases.forEach((alias) => {
          if (!alias.active) return;
          alias.goto.split(',').forEach((goto) => {
            addAlias(goto.trim(), { from: alias.address, type: 'alias' });
          });
        });
      } catch (err) {
        logger.error('Failed to fetch aliases:', err);
      }

      // --- Populate forwards from sieve filters ---
      try {
        const mailboxes: Mailbox[] = await mcc.mailbox.get('all');
        for (const mailbox of mailboxes) {
          const sieve = await mcc.mailbox.getActiveUserSieve(mailbox.username);
          const forwards = getForwards(sieve);
          for (const forward of forwards) {
            addAlias(forward, { from: mailbox.username, type: 'forward' });
          }
        }
      } catch (err) {
        logger.error('Failed to fetch mailboxes or sieves:', (err as Error)?.message || err);
      }

      logger.info('Alias Dictionary Initialised.');
    } finally {
      refreshInProgress = false;
      refreshPromise = null;
    }
  })();
  await refreshPromise;
}

/**
 * Regular expression used to extract forwarding targets from a sieve script.
 * Matches lines of the form: redirect "<target>";
 */
const sieve_regex = /^(?:redirect ")([^"]*)";/gm;

/**
 * Parses a sieve filter to extract all forwarding targets.
 *
 * @param sieve - The sieve filter text or array of lines.
 * @returns Array of forwarding addresses found.
 */
function getForwards(sieve: string[] | string): string[] {
  const forwards: string[] = [];
  const sieveText = Array.isArray(sieve) ? sieve.join('\n') : sieve;
  let m: RegExpExecArray | null;
  while ((m = sieve_regex.exec(sieveText)) !== null) {
    forwards.push(m[1]);
  }
  return forwards;
}

/**
 * Recursively resolves all aliases and forwards for a given email address.
 *
 * @param email - The address to resolve.
 * @param type - The type of relation leading here (root is null).
 * @param visited - A Set of already-visited emails (for cycle detection).
 * @returns Alias tree (see type).
 *
 * @remarks
 * Uses cycle detection to prevent infinite recursion on loops.
 */
function resolveAlias(email: string, type: AliasType, visited: Set<string> = new Set()): Alias {
  if (visited.has(email)) {
    logger.warn(`Circular alias detected at ${email}`);
    return { to: email, from: null, type };
  }
  visited.add(email);
  const result: Alias = { to: email, from: null, type };
  if (Object.prototype.hasOwnProperty.call(alias_dict.emails, email)) {
    alias_dict.emails[email].aliases.forEach((al) => {
      const child = resolveAlias(al.from, al.type, new Set(visited));
      if (!result.from) result.from = [child];
      else result.from.push(child);
    });
  }
  return result;
}

/**
 * Resolves all aliases and forwards for the specified user/email.
 * If the alias dictionary is stale, triggers a background refresh, but always returns the current cache immediately.
 *
 * @param email - The user email to resolve.
 * @returns Full Alias structure for the email.
 */
export function getAliasUser(email: string): Alias {
  logger.info(`Getting alias for ${email}`);
  const age = Date.now() - alias_dict.last_update_time.getTime();

  // Stale-while-revalidate: trigger refresh if needed, but do NOT wait.
  if (age > ALIAS_DICT_TTL && !refreshInProgress) {
    logger.info('Alias dictionary expired; starting background refresh.');
    void createAliasDictionary().catch((e) => logger.error('Background refresh failed:', e));
  }
  return resolveAlias(email, null);
}

/**
 * Clears the alias dictionary (for tests or admin/debug usage).
 * Also resets last_update_time to epoch.
 */
export function clearAliasDictionary(): void {
  alias_dict.emails = {};
  alias_dict.last_update_time = new Date(0);
  logger.info('Alias dictionary cleared.');
}

/**
 * Manually triggers a refresh of the alias dictionary (for tests/startup).
 */
export async function warmAliasDictionary(): Promise<void> {
  await createAliasDictionary();
}
