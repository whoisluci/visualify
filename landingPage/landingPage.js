import { PubSub } from "/pubSub.js";
import { STATE } from "/index.js";
import { renderTopItems } from "/topItems/topItems.js";

PubSub.subscribe({
    event: 'renderLandingPage',
    listener: renderLandingPage
})

export function renderLandingPage(parentID) {
    document.querySelector(parentID).innerHTLM =``;

    const main = document.createElement('main');
    document.querySelector(parentID).append(main);
    
    const logotype = document.createElement('img');
    logotype.id = 'logotype';
    logotype.src = '../static/logotype.svg';
    main.append(logotype);

    const ctaDiv = document.createElement('div');
    ctaDiv.id = 'cta';
    main.append(ctaDiv);

    const slogan = document.createElement('h2');
    slogan.id = 'slogan';
    slogan.textContent = 'Discover your music taste through data visualization.'
    ctaDiv.append(slogan);

    const logInBttn = document.createElement('button');
    ctaDiv.append(logInBttn);
    logInBttn.id = 'logInBttn';
    logInBttn.textContent = 'Log in with Spotify';

    logInBttn.addEventListener('click', async () => {
        /* PKCE code verifier */
        const generateRandomString = (length) => {
            const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            const values = crypto.getRandomValues(new Uint8Array(length));
            return values.reduce((acc, x) => acc + possible[x % possible.length], "");
        };
        
        const codeVerifier  = generateRandomString(64);
        
        /* Hash encoder */
        const sha256 = async (plain) => {
            const encoder = new TextEncoder()
            const data = encoder.encode(plain)
            return window.crypto.subtle.digest('SHA-256', data)
        };
          
        /* Base64 encoder */
        const base64encode = (input) => {
            return btoa(String.fromCharCode(...new Uint8Array(input)))
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
        };
        
        /* Code challenge generation */
        const hashed = await sha256(codeVerifier)
        const codeChallenge = base64encode(hashed);
        
        /* Authorization request */
        const authUrl = new URL("https://accounts.spotify.com/authorize")
        let scope = 'user-top-read';
        
        window.localStorage.setItem('codeVerifier', codeVerifier);
        
        const params =  {
          response_type: 'code',
          client_id: STATE.clientID,
          scope,
          code_challenge_method: 'S256',
          code_challenge: codeChallenge,
          redirect_uri: STATE.redirectUri,
        }
        
        authUrl.search = new URLSearchParams(params).toString();
        window.location.href = authUrl.toString();
    });
}