export const setUsername = (elem) => {
    const savedUsername = localStorage.getItem("slagalicaUsername")

    if(savedUsername){
        elem.value = savedUsername
    }

    
    elem.addEventListener("input",() => {
        localStorage.setItem("slagalicaUsername",elem.value)
    })
}

export const toggleModel = (modalElement) => {
    modalElement.classList.toggle("hide")
}

export const capitalizeAfterSpaces = (str) => {
    if(typeof(str) !== "string") return ""
    
    const words = str.split(" ");
    
    for (let i = 0; i < words.length; i++) {
      words[i] = words[i].charAt(0).toUpperCase() + words[i].slice(1);
    }
    
    return words.join(" ");
  }
  
export const removeAllEventListeners = (container) => {
    if (container && container.parentNode) {
        const newContainer = container.cloneNode(true);
        container.parentNode.replaceChild(newContainer, container);
    }
};

export const validateAddition = (prev,curr) => {
    if (!prev && ["+", "*", "/","-",")"].includes(curr)) return false;
    if (["+", "*", "/","-"].includes(prev) && ["+", "*", "/","-"].includes(curr))
      return false;
    if (!isNaN(prev) && curr === "(") return false;
    if (prev === ")" && !isNaN(curr)) return false;
    if(prev === ")" && curr === "(") return false;
    if (!isNaN(prev) && !isNaN(curr)) return false;
    return true;
}