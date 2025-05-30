import { PubSub } from "./logic/pubSub.js";
import { renderTopItemsPage } from "./pages/topItemsPage/topItemsPage.js";
import { handleRedirect } from "./logic/handleRedirect.js"
import { fetchItems} from "./fetcher/fetchItems.js";
import { renderSongsDecadePage } from "./pages/songsDecadePage/songsDecadePage.js";
import { renderLatestSongsPage } from "./pages/latestSongsPage/latestSongsPage.js";
import { renderTopGenresPage } from "./pages/topGenrePage/topGenres.js";
import { renderArrows } from "./components/arrows/arrows.js";
import { renderWorldMapPage} from "./pages/worldMapPage/worldMapPage.js";
import { renderLandingPage } from "./pages/landingPage/landingPage.js";

export const STATE = {
    clientID: 'e8189908e7ce4f7ea8a663354e997ff2',
    redirectUri: 'https://maumt.reipino.com/wdv/2025/visualify/',
    userData: {
        artists: {
            shortTerm: null,
            mediumTerm: null,
            longTerm: null
        },
        tracks: {
            shortTerm: null,
            mediumTerm: null,
            longTerm: null
        }
    },

    setStateData(key, timeTerm, data){
        this.userData[key][timeTerm] = data;
    },

    getFormattedDecadeData(){
        const decades = [2020, 2010, 2000, 1990, 1980, 1970, 1960, 1950];
        const timeTerms = ["shortTerm", "mediumTerm", "longTerm"];
        const formatted = {};

        timeTerms.forEach((timeTerm, i) => {
            const songData = this.userData.tracks[timeTerm];
            formatted[timeTerm] = [];

            for(const decade of decades){
                const decadefiltered = songData.filter(item => String(decade).slice(0, 3) === String(item.album.release_date).slice(0, 3));
                const obj = {
                    decade,
                    amount: decadefiltered.length,
                    topArtist: false,
                    image: false,
                }
                if(decadefiltered.length !== 0){
                    obj.topArtist = decadefiltered[0].artists[0].name;
                    obj.image = decadefiltered[0].album.images[0].url;
                }

                formatted[timeTerm].push(obj); 
            }
            //for the blank space in the decadeDiagram
            formatted[timeTerm].push({
                decade: false,
                amount: false,
            })
        });
        return formatted;
    }
};

const app = {
    async getDataAndSet(){
        const spotifyTimeTerms = ["short_term", "medium_term", "long_term"];
        const timeTerms = ["shortTerm", "mediumTerm", "longTerm"];
        const spotifyTypes = ["artists", "tracks"];
        const types = ["artists", "tracks"];

        for (let typeIndex = 0; typeIndex < spotifyTypes.length; typeIndex++) {
            const spotifyType = spotifyTypes[typeIndex];

            for (let timeTermIndex = 0; timeTermIndex < spotifyTimeTerms.length; timeTermIndex++) {
                const timeTerm = spotifyTimeTerms[timeTermIndex];
                const data = await fetchItems(timeTerm, spotifyType);
                STATE.setStateData(types[typeIndex], timeTerms[timeTermIndex], data);
            }
        }
    },

    async startApp(){
        if (localStorage.getItem('accessToken')) {
            this.renderApp();
            return;
        } 

        const handled = await handleRedirect();
        if (!handled) {
            PubSub.publish({
                event: 'renderLandingPage',
                detail: '#wrapper'
            });
        } else {        
            this.renderApp();
        }
    },

    async renderApp(){
        await this.getDataAndSet();
        renderArrows("#arrowOverlay", "#wrapper");
        await renderTopItemsPage('#wrapper');
        renderTopGenresPage("#wrapper");
        renderSongsDecadePage("#wrapper",  STATE.getFormattedDecadeData());
        renderLatestSongsPage("#wrapper"); 
        renderWorldMapPage("#wrapper");
    }
}

app.startApp();