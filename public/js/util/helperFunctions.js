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
    const newContainer = container.cloneNode(true);
    container.parentNode.replaceChild(newContainer, container);
}