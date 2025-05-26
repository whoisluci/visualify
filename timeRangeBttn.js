export function renderTimeRangeBttn (parentID) {
    const typeSel = document.createElement('select');
    typeSel.id = 'typeSel';
    document.querySelector(parentID).append(typeSel);

    const optShortTerm = document.createElement('option');
    optShortTerm.classList.add('opt');
    optShortTerm.value = 'shortTerm'; //short_term
    typeSel.append(optShortTerm);
    optShortTerm.textContent = 'Last 4 weeks';

    const optMediumTerm = document.createElement('option');
    optMediumTerm.classList.add('opt');
    typeSel.append(optMediumTerm);
    optMediumTerm.textContent = 'Last 6 months';
    optMediumTerm.value = 'mediumTerm'; //medium_range

    const optLongTerm = document.createElement('option');
    optLongTerm.classList.add('opt');
    typeSel.append(optLongTerm);
    optLongTerm.textContent = 'Last 12 months'; 
    optLongTerm.value = 'longTerm'; //long_range

    return typeSel;
}