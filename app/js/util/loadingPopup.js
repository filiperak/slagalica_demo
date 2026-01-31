export const loadingPopup = () => {
        
    const popup = document.createElement("div")
    popup.className = "popup-modal"
    const p = document.createElement("p")
    p.innerText = "Waiting for opponent ..."
    const b = document.createElement("button")
    b.innerText = "Cancel"
    b.onclick(() => {
        popup.className = "hide"
    })
    popup.append(p,b)
    document.body.appendChild(popup)

    
        
}