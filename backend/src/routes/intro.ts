import env from "../envvars";
import axios from "axios";

type ScoreDictionary = {
    groups: {
        [key:string]: string,
    }
    last_update_time: Date
}

const scoresDict: ScoreDictionary = { groups: {}, last_update_time: new Date() };

export async function getScores() {
    await axios.get(`https://sheets.googleapis.com/v4/spreadsheets/1y0uzTUds5Bk6Hxo871irgtirefiDGBKbovsL4KPtxpQ/values/Scoreboard!B101:AK102?key=${env.GOOGLE_KEY}`).then(result => {
        console.log(result);
        const scores: string[] = result.data.values[0];
        const names: string[] = result.data.values[1];
        for (let i = 0; i < names.length; i++) {
            scoresDict.groups[names[i]] = scores[i];
            console.log(`group: ${names[i]} with score: ${scores[i]}`)
        }
    }).catch(err => console.warn(err));
    return scoresDict.groups;
}

// Routing function.
export function getCrazy88Scoreboard() {
    const age = Date.now() - scoresDict.last_update_time.getTime();
    // If the dictionary is 1 hour old, we update it.
    if ((age / 3600000) > 1) {
        getScores().then(() => console.log("Updated Score dictionary"));
        scoresDict.last_update_time = new Date();
    }
    return scoresDict;
}
