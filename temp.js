const popupMessageDefault = (t) => {
    let text;
    console.log(t);
    if (t) {
      t.data > 0
        ? (text = `🥳Osvojili ste ${t.data} poena🥳`)
        : (text = `🤡Osvojili ste ${t.data} poena🤡`);
    } else {
      text = `🤡Osvojili ste 0 poena🤡`;
    }
    this.drawPopup(text, () => {});
  };
  if (!this._socket.hasListeners("scoreSubmitedAsocijacije")) {
    this._socket.on("scoreSubmitedAsocijacije", popupMessageDefault);
  }