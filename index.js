import { PubSub } from "/pubSub.js";
import { renderLandingPage } from "/landingPage/landingPage.js";
import { renderTopItems } from "/topItems/topItems.js";
import { handleRedirect } from "/handleRedirect.js"
import { renderTopGenres } from "/topGenres/topGenres.js";

export const STATE = {
    clientID: 'e8189908e7ce4f7ea8a663354e997ff2',
    redirectUri: 'http://127.0.0.1:8888/',
    userData: {
        artists: {
            shortTerm: null,
            mediumTerm: null,
            longTerm: null
        },
        songs: {
            shortTerm: null,
            mediumTerm: null,
            longTerm: null
        }
    }
};

async function main() {
    if (localStorage.getItem('accessToken')) {
        renderTopItems('#wrapper');
        return;
    } 

    const handled = await handleRedirect();
    if (!handled) {
        PubSub.publish({
            event: 'renderLandingPage',
            detail: '#wrapper'
        });
    } else {        
        renderTopItems('#wrapper');
    }
}

main();