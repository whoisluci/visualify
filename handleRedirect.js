import { STATE } from "./index.js";

export async function handleRedirect() {
    /* Parse to obtain code param */
    const urlParams = new URLSearchParams(window.location.search);
    /* Code = necessary to request access token */
    const code = urlParams.get('code');
    const codeVerifier = localStorage.getItem('codeVerifier');

    if (!code) {
        console.warn('No code found');
        return;
    }

    if (!codeVerifier) {
        console.warn('No code verifier found');
        return;
    }

    window.history.replaceState({}, document.title, STATE.redirectUri);
    
    /* Access token request – lasts 1h */
    const url = "https://accounts.spotify.com/api/token";
    const payload = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            client_id: STATE.clientID,
            grant_type: 'authorization_code',
            code,
            redirect_uri: STATE.redirectUri,
            code_verifier: codeVerifier,
            scope:"user-read-recently-played"
           })
       };

    const rqst = await fetch(url, payload);
    const response = await rqst.json();

    if (response.access_token) {
        localStorage.setItem('accessToken', response.access_token);
        if (response.refresh_token) {
            localStorage.setItem('refreshToken', response.refresh_token);
        }
        return true;
    }
}


