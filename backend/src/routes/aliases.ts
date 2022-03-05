import {mcc} from "../index";

/**
 * The alias_dict is an object that maps every email to all its aliases and or forwards.
 * <p>
 *     This is done in the form of:
 *     {
 *         'email': ['alias1', 'alias2', 'forward1']
 *     }
 */
type AliasType = "alias" | "forward" | null
type AliasEntry = {from: string, type: AliasType}
type AliasDictionary = {
    emails: {
        [key:string] : {
            aliases: AliasEntry[]
        },
    }
    last_update_time: Date
}
const alias_dict: AliasDictionary = { emails: {}, last_update_time: new Date() }

/**
 * Function that adds an alias to the dictionary.
 * @param email - The target email.
 * @param alias - The alias for the target email.
 */
function addAlias(email: string, alias: AliasEntry) {
    // Check if email is known.
    if (Object.prototype.hasOwnProperty.call(alias_dict.emails, email)) {
        alias_dict.emails[email].aliases.push(alias)
    } else {
        alias_dict.emails[email] = {aliases: [alias]}
    }
}

/**
 * Function that creates the alias_dict.
 * First uses the MailCowClient API wrapper to get all the plain aliases
 * and then it uses the user sieves to get all the forwards.
 */
export async function createAliasDictionary() {
    alias_dict.emails = {}
    // Get all aliases.
    await mcc.aliases.get().then((res) => {
        // Force response to array.
        let aliases
        if (Array.isArray(res)) {
            aliases = res
        } else {
            aliases = [res]
        }
        // For each alias we have...
        aliases.forEach((alias) => {
            // ...loop over the GOTOs.
            alias.goto.split(',').forEach((goto) => {
                // Only consider active aliases.
                if (alias.active) {
                    addAlias(goto, {from: alias.address, type: "alias"})
                }
            })
        })
    }).catch(err => {
        console.log(err)
    })

    // Get all mailboxes.
    await mcc.mailbox.get().then((mailboxes) => {
        // For each mailbox...
        mailboxes.forEach(async (mailbox) => {
            // ...get the sieve filter.
           await mcc.mailbox.getActiveUserSieve(mailbox.username).then((sieve) => {
                // Extract the forwards out of the sieve.
                getForwards(sieve).forEach((forward) => {
                    // If 'mailbox' forwards to 'adress' than 'mailbox' is an alias of 'adress'.
                    addAlias(forward, {from: mailbox.username, type: "forward"})
                })
            })
        })
    }).catch(err => {
        console.log(err)
    })

    alias_dict.last_update_time = new Date()
    console.log("Alias Dictionary Initialised.")
}

const sieve_regex = /^(?:redirect ")([^\"]*)";/gm;

/**
 * Function to extract forwards from a sieve filter.
 * <p>
 *     Sieve filters are (usually) in the form of:
 *     "
 *     redirect <target1>;
 *     redirect <target2>;
 *     keep;
 *     "
 *     So we use regex to extract the targets.
 * </p>
 * @param sieve - The sieve filter to parse.
 */
function getForwards(sieve: string[]) {
    let m;
    // Store results.
    const forwards = [];

    // Prevent weird unending loops.
    while ((m = sieve_regex.exec(sieve.toString())) !== null) {
        forwards.push(m[1])
    }

    return forwards
}

// An Alias has a 'to' and 'from' field. However the 'from' field can be another Alias.
type Alias = {
    to: string,
    from: null | Alias[],
    type: AliasType,
}

/**
 * Function that takes an email address and returns it corresponding Alias typing.
 * @param email - The goto address of the alias.
 * @param type
 */
function resolveAlias(email: string, type: AliasType): Alias {
    // Resulting Alias object.
    const result: Alias = {to: email, from: null, type: type}

    // Check if the email can be found in the alias dictionary..
    if (Object.prototype.hasOwnProperty.call(alias_dict.emails, email)) {
        // ...if so, add all the aliases to the result object.
        alias_dict.emails[email].aliases.forEach((al) => {
            // Recurse on the alias.
            if (result.from === null) {
                result.from = [resolveAlias(al.from, al.type)]
            } else {
                result.from.push(resolveAlias(al.from, al.type));
            }
        })
    }
    return result
}

// Routing function.
export function getAliasUser(email: string) {
    const age = Date.now() - alias_dict.last_update_time.getTime();
    const result = resolveAlias(email, null);
    // If the dictionary is 1 hour old, we update it.
    if ((age / 3600000) > 1) {
        createAliasDictionary().then(() => console.log("Updated alias dictionary"));
    }
    return result;
}
