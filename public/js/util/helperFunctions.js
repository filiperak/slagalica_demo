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