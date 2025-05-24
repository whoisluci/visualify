export function renderHeadline (parentID, text) {
    const headline = document.createElement('h1');
    headline.id = 'headline';
    document.querySelector(parentID).append(headline);
    headline.textContent = text;
}