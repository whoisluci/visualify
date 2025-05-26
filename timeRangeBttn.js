export function renderTimeRangeBttn (parentID) {
    const timeRngSel = document.createElement('select');
    timeRngSel.id = 'timeRngSel';
    document.querySelector(parentID).append(timeRngSel);

    const optShortTerm = document.createElement('option');
    optShortTerm.classList.add('opt');
    optShortTerm.value = 'short_term';
    timeRngSel.append(optShortTerm);
    optShortTerm.textContent = 'Last 4 weeks';

    const optMediumTerm = document.createElement('option');
    optMediumTerm.classList.add('opt');
    timeRngSel.append(optMediumTerm);
    optMediumTerm.textContent = 'Last 6 months';
    optMediumTerm.value = 'medium_range';

    const optLongTerm = document.createElement('option');
    optLongTerm.classList.add('opt');
    timeRngSel.append(optLongTerm);
    optLongTerm.textContent = 'Last 12 months';
    optLongTerm.value = 'long_range';

    return timeRngSel;
}