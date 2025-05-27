export function renderArrows(parentSelector, moveParentSelector){
    const parent = document.querySelector(parentSelector);
    const moveParent = document.querySelector(moveParentSelector);
    const imgDir = "./static/icons/";

    const arrowContainer = document.createElement("div");
    arrowContainer.id = "arrowContainer";
    parent.appendChild(arrowContainer)

    arrowContainer.innerHTML = `<div id="leftArrow" class="arrow">
                                    <img src="${imgDir}leftArrow.svg">
                                </div>
                                <div id="rightArrow" class="arrow">
                                    <img src="${imgDir}rightArrow.svg">
                                </div>`;

                        
    moveParent.className = "0";
    const startPos = 0;
    const maxPos = -400;

    parent.querySelector("#leftArrow").addEventListener("click", () => {
        const position = Number(moveParent.className);
        if(position !== startPos){
            moveParent.style.transform = `translate(${position + 100}vw, 0)`;
            moveParent.className = position + 100;
            parent.querySelector("#rightArrow").style.display = "block";
        }

    });

    parent.querySelector("#rightArrow").addEventListener("click", () => {
        const position = Number(moveParent.className);

        if(position !== maxPos){
            parent.querySelector("#leftArrow").style.display = "block";
            moveParent.style.transform = `translate(${position - 100}vw, 0)`;
            moveParent.className = position - 100;
        }
    });
}