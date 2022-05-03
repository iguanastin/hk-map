'use strict';

const e = React.createElement;


class App extends React.Component {
  constructor(props) {
    super(props);

    this.defaultX = -800;
    this.defaultY = -50;
    this.defaultZoom = 1;

    let typeFilter = getCookie("type_filter");
    typeFilter = typeFilter === "" ? [] : typeFilter.split(",");
    let beastFilter = getCookie("beast_filter");
    beastFilter = beastFilter === "" ? [] : beastFilter.split(",");

    this.state = { filter: { types: typeFilter, beasts: beastFilter }, x: this.defaultX, y: this.defaultY, zoom: this.defaultZoom };

    this.cref = React.createRef();

    $("#filter-button")[0].addEventListener("click", () => {
      reactDialog(FilterDialog, { app: this });
    });

    this.mouseDown = false;
    this.draggedThisClick = false;
    this.dragging = false;
    document.addEventListener("mouseup", () => {
      if (this.dragging) {
        let t = {...this.state};
        t.x = parseFloat(this.cref.current.style.left);
        t.y = parseFloat(this.cref.current.style.top);
        this.setState(t);
      }
      this.mouseDown = false;
      this.dragging = false;
    });
    document.addEventListener("mousemove", (e) => {
      if (this.mouseDown) {
        this.dragging = true;
        this.draggedThisClick = true;
      }
      if (this.dragging) {
        this.cref.current.style.left = parseFloat(this.cref.current.style.left) + e.movementX + "px";
        this.cref.current.style.top = parseFloat(this.cref.current.style.top) + e.movementY + "px";
      }
    });
    document.addEventListener("keyup", (e) => {
      if (e.ctrlKey && e.key === "\\") {
        // let t = {...this.state}
        // t.x = this.defaultX;
        // t.y = this.defaultY;
        // t.zoom = this.defaultZoom;
        // this.setState(t);
        navigator.clipboard.writeText("map = " + JSON.stringify(map).replaceAll("},{", "},\n{"));
      }
    })
    document.addEventListener("click", (e) => {
      if (this.draggedThisClick) {
        this.draggedThisClick = false;
        e.stopPropagation();
      }
    }, true);
  }

  isPinFiltered(pin) {
    return this.state.filter.types.includes(pin.type);
  }

  render() {
    let el = [];

    for (let i = 0; i < map.rooms.length; i++) {
      let room = map.rooms[i];
      if (room.internal) continue;
      let x = room.x*this.state.zoom;
      let y = room.y*this.state.zoom;
      el.push(e(MapRoom, { key: room.name, room: room, x: x, y: y, scale: this.state.zoom, app: this }));
    }

    return e("div", { className: "panzoom-container", onWheel: (e) => {
      if (!this.dragging && e.deltaY !== 0) {
        let z = e.deltaY > 0 ? 8/10 : 10/8;

        const bx = (e.clientX - this.state.x);
        const by = (e.clientY - this.state.y);
        const ax = (e.clientX - this.state.x) * z;
        const ay = (e.clientY - this.state.y) * z;

        let t = {...this.state};
        t.zoom = t.zoom * z;
        t.x += bx - ax;
        t.y += by - ay;
        this.setState(t);
      }
    }, onMouseDown: (e) => {
      this.mouseDown = true;
      this.draggedThisClick = false;
      e.stopPropagation();
    }, onDragStart: (e) => {
      e.preventDefault();
    } }, e("div", { ref: this.cref, className: "panzoom-content", style: { left: this.state.x, top: this.state.y, width: map.width * this.state.zoom, height: map.height * this.state.zoom } }, el));
  }
}

class MapRoom extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    let pins = [];

    if (this.props.room.notes) {
      for (let i = 0; i < this.props.room.notes.length; i++) {
        let note = this.props.room.notes[i];
        let x = note.pos.x * this.state.width * this.props.scale;
        let y = note.pos.y * this.state.height * this.props.scale;
        if (isNaN(x)) x = 0;
        if (isNaN(y)) y = 0;
        pins.push(e(Pin, { key: note.id, note: note, room: this.props.room, app: this.props.app, x: x, y: y }));
      }
    }

    return e("div", { className: "map-item", style: { left: this.props.x, top: this.props.y } },
      e("img", { src: this.props.room.src, loading: "lazy", title: this.props.room.name, style: { width: this.props.scale * this.state.width + "px" }, onLoad: (e) => {
        this.setState({ width: e.target.width, height: e.target.height });
      }, onClick: () => {
        reactDialog(RoomDialog, { room: this.props.room, app: this.props.app });
      } }),
      pins
    );
  }
}

class Pin extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return e("img", { hidden: this.props.app.isPinFiltered(this.props.note), title: this.props.note.id, className: "map-pin", src: this.props.note.pin, style: { left: this.props.x, top: this.props.y }, onClick: (e) => {
      if (e.ctrlKey) reactDialog(PinDialog, { pin: this.props.note, room: this.props.room, success: () => {
        this.forceUpdate();
      } });
      else if (e.shiftKey) reactDialog(ConfirmDialog, { title: "Delete pin", msg: "Permanently delete '" + this.props.note.id + "'?", ok: () => {
        this.props.room.notes.splice(this.props.room.notes.indexOf(this.props.note), 1);
        this.props.app.forceUpdate();
      } });
    } });
  }
}

class Exit extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    let icon = this.props.exit.direction === "none" ? "assets/misc/thing.png" : "assets/inventory/RT_LT_arrow.png";
    let transform = "translate(-50%, -50%)";
    if (this.props.exit.direction == "left") {
      transform = "translate(-50%, -50%) rotate(180deg)";
    } else if (this.props.exit.direction == "up") {
      transform = "translate(-50%, -50%) rotate(-90deg)";
    } else if (this.props.exit.direction == "down") {
      transform = "translate(-50%, -50%) rotate(90deg)";
    }
    return e("img", { className: "room-exit", src: icon, style: { left: this.props.x, top: this.props.y, transform: transform }, onClick: (e) => {
      if (e.shiftKey) {
        reactDialog(ExitDialog, { exit: this.props.exit, room: this.props.room, success: () => {
          this.forceUpdate();
        } });
        return;
      }

      let id = this.props.exit.to.split(":")[0];
      let index = this.props.exit.to.split(":")[1];
      let to = null;
      for (let i = 0; i < map.rooms.length; i++) {
        if (map.rooms[i].name === id) {
          to = map.rooms[i];
          break;
        }
      }
      this.props.roomD.props.d.close();
      reactDialog(RoomDialog, { room: to, app: this.props.app, exit: to.exits ? to.exits[index] : null });
    } });
  }
}




class FilterDialog extends React.Component {
  constructor(props) {
    super(props);

    this.types = ["geo", "charm", "ability", "boss", "quest", "grub", "bench", "cocoon", "map", "stag", "mask", "vessel", "rancid-egg", "warrior-dream", "whispering-root", "journal", "key", "charm-notch", "idol", "tram", "hotsprings", "shop", "npc", "pale-ore", "soul", "lore", "update"];
    this.trefs = [];
    for (let i = 0; i < this.types.length; i++) {
      this.trefs.push(React.createRef());
    }

    this.erefs = [];
    for (let i = 0; i < bestiary.length; i++) {
      this.erefs.push(React.createRef());
    }
  }

  render() {
    let filter = this.props.app.state.filter;

    let types = [];
    for (let i = 0; i < this.types.length; i++) {
      let type = this.types[i];
      let name = type.charAt(0).toUpperCase() + type.slice(1).replaceAll("-", " ");
      types.push(e("div", { key: type, className: "d-filter-check", onClick: () => {
        this.trefs[i].current.checked = !this.trefs[i].current.checked;
      } }, e("input", { ref: this.trefs[i], type: "checkbox", defaultChecked: !filter.types.includes(type), onClick: (e) => e.stopPropagation() }), name));
    }

    let beasts = [];
    for (let i = 0; i < bestiary.length; i++) {
        const beast = bestiary[i];
        beasts.push(e("div", { key: beast.id, className: "d-filter-check", onClick: () => {
          this.erefs[i].current.checked = !this.erefs[i].current.checked;
        } }, e("input", { ref: this.erefs[i], type: "checkbox", defaultChecked: !filter.beasts.includes(beast.id), onClick: (e) => e.stopPropagation() }), beast.name));
    }

    return e("div", { className: "dialog" },
      e("div", { className: "d-title" }, "Filters"),
      e("div", { className: "d-filter-box" },
        e("div", { className: "d-filter-type" },
          "Points of Interest",
          e("div", { className: "d-filter-allnone" }, e("div", { className: "d-button button", onClick: () => {
            for (let i = 0; i < this.trefs.length; i++) {
              this.trefs[i].current.checked = true;
            }
          } }, "All"), e("div", { className: "d-button button", onClick: () => {
            for (let i = 0; i < this.trefs.length; i++) {
              this.trefs[i].current.checked = false;
            }
          } }, "None")),
          e("div", { className: "d-filter-list" }, types),
        ),
        e("div", { className: "d-filter-type" },
          "Enemies",
          e("div", { className: "d-filter-allnone" }, e("div", { className: "d-button button", onClick: () => {
            for (let i = 0; i < this.erefs.length; i++) {
              this.erefs[i].current.checked = true;
            }
          } }, "All"), e("div", { className: "d-button button", onClick: () => {
            for (let i = 0; i < this.erefs.length; i++) {
              this.erefs[i].current.checked = false;
            }
          } }, "None")),
          e("div", { className: "d-filter-list" }, beasts),
        )
      ),
      e("div", { className: "d-buttons"},
        e("div", { className: "d-button button", onClick: () => {
          filter.types = [];
          for (let i = 0; i < this.types.length; i++) {
            if (!this.trefs[i].current.checked) {
              filter.types.push(this.types[i]);
            }
          }
          setCookie("type_filter", filter.types.join(","), 365);

          filter.beasts = [];
          for (let i = 0; i < bestiary.length; i++) {
            if (!this.erefs[i].current.checked) {
              filter.beasts.push(bestiary[i].id);
            }
          }
          setCookie("beast_filter", filter.beasts.join(","), 365);

          this.props.d.close();
          this.props.app.forceUpdate();
        } }, "Apply"),
        e("div", { className: "d-button button", onClick: () => {
          this.props.d.close();
        } }, "Cancel")
      )
    );
  }
}


class RoomDialog extends React.Component {
  constructor(props) {
    super(props);

    let mouseUpL = () => {
      if (this.dragging) {
        let t = {...this.state};
        t.x = parseFloat(this.cref.current.style.left);
        t.y = parseFloat(this.cref.current.style.top);
        this.setState(t);
      }
      this.mouseDown = false;
      this.dragging = false;
    };
    let mouseMoveL = (e) => {
      if (this.mouseDown) {
        this.dragging = true;
        this.draggedThisClick = true;
      }
      if (this.dragging) {
        this.cref.current.style.left = parseFloat(this.cref.current.style.left) + e.movementX + "px";
        this.cref.current.style.top = parseFloat(this.cref.current.style.top) + e.movementY + "px";
      }
    };
    let clickL = (e) => {
      if (this.draggedThisClick) {
        this.draggedThisClick = false;
        e.stopPropagation();
      }
    };

    let tClose = props.d.close;
    props.d.close = () => {
      document.removeEventListener("mouseup", mouseUpL);
      document.removeEventListener("mousemove", mouseMoveL);
      document.removeEventListener("click", clickL, true);
      tClose();
    };

    // TODO Open room at specified exit/position
    this.defaultX = 0;
    this.defaultY = 0;
    this.defaultZoom = 1;

    this.state = { x: this.defaultX, y: this.defaultY, zoom: this.defaultZoom, width: 0, height: 0 };

    this.cref = React.createRef();
    this.dref = React.createRef();

    this.mouseDown = false;
    this.draggedThisClick = false;
    this.dragging = false;

    document.addEventListener("mouseup", mouseUpL);
    document.addEventListener("mousemove", mouseMoveL);
    document.addEventListener("click", clickL, true);
  }

  render() {
    let el = [];

    if (this.props.room.notes) {
      for (let i = 0; i < this.props.room.notes.length; i++) {
        let pin = this.props.room.notes[i];
        let x = pin.pos.x * this.state.width * this.state.zoom;
        let y = pin.pos.y * this.state.height * this.state.zoom;
        el.push(e(Pin, { key: pin.id, note: pin, room: this.props.room, app: this.props.app, x: x, y: y }));
      }
    }

    if (this.props.room.exits) {
      for (let i = 0; i < this.props.room.exits.length; i++) {
        let exit = this.props.room.exits[i];
        let x = exit.x * this.state.width * this.state.zoom;
        let y = exit.y * this.state.height * this.state.zoom;
        el.push(e(Exit, { key: exit.to, exit: exit, x: x, y: y, roomD: this, app: this.props.app }));
      }
    }

    return e("div", { ref: this.dref, className: "dialog d-room", onWheel: (e) => {
      if (!this.dragging && e.deltaY !== 0) {
        let z = e.deltaY > 0 ? 8/10 : 10/8;

        const bx = (e.clientX - this.state.x);
        const by = (e.clientY - this.state.y);
        const ax = (e.clientX - this.state.x) * z;
        const ay = (e.clientY - this.state.y) * z;

        let t = {...this.state};
        t.zoom = t.zoom * z;
        t.x += bx - ax;
        t.y += by - ay;
        this.setState(t);
      }
    }, onMouseDown: (e) => {
      this.mouseDown = true;
      this.draggedThisClick = false;
      e.stopPropagation();
    }, onDragStart: (e) => {
      e.preventDefault();
    } }, e("div", { ref: this.cref, className: "panzoom-content", style: { left: this.state.x, top: this.state.y } },
    e("img", { style: this.state.width === 0 ? null : { width: this.state.zoom * this.state.width + "px" }, src: "assets/rooms/" + this.props.room.name + ".jpg", onLoad: (e) => {
      let t = {...this.state};
      t.width = e.target.width;
      t.height = e.target.height;

      if (this.props.exit) {
        let r = this.dref.current.getBoundingClientRect();
        let rp = e.target.getBoundingClientRect();

        let x = (-rp.width * this.props.exit.x + r.width/2);
        let y = (-rp.height * this.props.exit.y + r.height/2);

        let centerX = r.width / 2 - rp.width / 2;
        let centerY = r.height / 2 - rp.height / 2;

        const over = 50;
        if (this.props.exit.direction == "left") x = Math.max(Math.min(x, over), centerX);
        else if (this.props.exit.direction == "right") x = Math.min(Math.max(x, -(rp.width - r.width + over)), centerX);
        else if (this.props.exit.direction == "up") y = Math.max(Math.min(y, over), centerY);
        else if (this.props.exit.direction == "down") y = Math.min(Math.max(y, -(rp.height - r.height + over)), centerY);

        t.x = x;
        t.y = y;
      }

      this.setState(t);
    }, onClick: (e) => {
      let b = e.target.getBoundingClientRect();
      let x = (e.pageX - b.x) / e.target.width;
      let y = (e.pageY - b.y) / e.target.height;
      if (e.ctrlKey && !e.shiftKey) {
        reactDialog(PinDialog, { x: x, y: y, room: this.props.room, success: () => {
          this.props.app.forceUpdate();
          this.forceUpdate();
        } });
      } else if (e.shiftKey && !e.ctrlKey) {
        reactDialog(ExitDialog, { x: x, y: y, room: this.props.room, success: () => {
          this.props.app.forceUpdate();
          this.forceUpdate();
        } });
      }
    } }),
    el));
  }
}


class ExitDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { direction: props.exit ? props.exit.direction : "none" };

    this.toRef = React.createRef();
    this.noteRef = React.createRef();
  }

  createOrUpdate() {
    this.props.d.close();
    let exit = null;
    if (this.props.exit) {
      exit = this.props.exit;
      exit.to = this.toRef.current.value;
      exit.note = this.noteRef.current.value;
      exit.direction = this.state.direction;
    } else {
      exit = { x: this.props.x, y: this.props.y };
      exit.to = this.toRef.current.value;
      exit.note = this.noteRef.current.value;
      exit.direction = this.state.direction;
      if (!this.props.room.exits) this.props.room.exits = [];
      this.props.room.exits.push(exit);
    }
    if (this.props.success) this.props.success(exit, this.props.room);
  }

  render() {
    return e("div", { className: "dialog" },
      e("div", { className: "d-title" }, this.props.pin ? "Edit Exit" : "Create Exit"),
      e("div", { className: "d-inputrow" }, "To: ", e("input", { autoFocus: true, ref: this.toRef, type: "text", defaultValue: this.props.exit ? this.props.exit.to : "" })),
      "Note: ",
      e("br"),
      e("div", { className: "d-inputrow" }, e("textarea", { ref: this.noteRef, defaultValue: this.props.exit ? this.props.exit.note : "" })),
      e("div", { className: "d-pin-list" },
        e("img", { src: "assets/misc/thing.png", className: this.state.direction === "none" ? "d-pin d-pin-sel" : "d-pin", onClick: () => {
          let t = {...this.state};
          t.direction = "none";
          this.setState(t);
        } }),
        e("img", { src: "assets/inventory/RT_LT_arrow.png", style: { transform: "rotate(180deg)" }, className: this.state.direction === "left" ? "d-pin d-pin-sel" : "d-pin", onClick: () => {
          let t = {...this.state};
          t.direction = "left";
          this.setState(t);
        } }),
        e("img", { src: "assets/inventory/RT_LT_arrow.png", style: { transform: "rotate(-90deg)" }, className: this.state.direction === "up" ? "d-pin d-pin-sel" : "d-pin", onClick: () => {
          let t = {...this.state};
          t.direction = "up";
          this.setState(t);
        } }),
        e("img", { src: "assets/inventory/RT_LT_arrow.png", style: { transform: "rotate(90deg)" }, className: this.state.direction === "down" ? "d-pin d-pin-sel" : "d-pin", onClick: () => {
          let t = {...this.state};
          t.direction = "down";
          this.setState(t);
        } }),
        e("img", { src: "assets/inventory/RT_LT_arrow.png", className: this.state.direction === "right" ? "d-pin d-pin-sel" : "d-pin", onClick: () => {
          let t = {...this.state};
          t.direction = "right";
          this.setState(t);
        } })
      ),
      e("div", { className: "d-buttons"},
        e("div", { className: "d-button button", onClick: () => {
          this.createOrUpdate();
        } }, this.props.pin ? "Update" : "Create"),
        e("div", { className: "d-button button", onClick: () => {
          this.props.d.close();
        } }, "Cancel")
      )
    );
  }
}

/*
  Expects props:
  pin: room note/pin object (optional. Only pass when editing pin)
  x: float (optional. Required if creating new pin)
  y: float (optional. Required if creating new pin)

  Instantiate with reactDialog(PinDialog, { props })
*/
class PinDialog extends React.Component {
  constructor(props) {
    super(props);
    this.state = { selectedPin: props.pin ? map.pins.indexOf(props.pin.pin) : 0 };

    this.idRef = React.createRef();
    this.typeRef = React.createRef();
    this.noteRef = React.createRef();
  }

  createOrUpdate() {
    this.props.d.close();
    let pin = null;
    if (this.props.pin) {
      pin = this.props.pin;
      this.props.pin.id = this.idRef.current.value;
      this.props.pin.type = this.typeRef.current.value;
      this.props.pin.note = this.noteRef.current.value;
      this.props.pin.pin = map.pins[this.state.selectedPin];
    } else {
      pin = { pos: { x: this.props.x, y: this.props.y } };
      pin.id = this.idRef.current.value;
      pin.type = this.typeRef.current.value;
      pin.note = this.noteRef.current.value;
      pin.pin = map.pins[this.state.selectedPin];
      if (!this.props.room.notes) this.props.room.notes = [];
      this.props.room.notes.push(pin);
    }
    if (this.props.success) this.props.success(pin, this.props.room);
  }

  render() {
    let pins = [];
    for (let i = 0; i < map.pins.length; i++) {
      const cI = i;
      pins.push(e("img", { key: map.pins[i], src: map.pins[i], className: i === this.state.selectedPin ? "d-pin d-pin-sel" : "d-pin", onClick: () => {
        let t = {...this.state};
        t.selectedPin = cI;
        this.setState(t);
      } }));
    }

    return e("div", { className: "dialog" },
      e("div", { className: "d-title" }, this.props.pin ? "Edit Pin" : "Create Pin"),
      e("div", { className: "d-inputrow" }, "ID: ", e("input", { autoFocus: true, ref: this.idRef, type: "text", defaultValue: this.props.pin ? this.props.pin.id : this.props.room.name + "." })),
      e("div", { className: "d-inputrow" }, "Type: ", e("input", { ref: this.typeRef, type: "text", defaultValue: this.props.pin ? this.props.pin.type : "", onChange: (e) => {
        let mapping = ["grub", "bench", "soul", "geo", "map", "rancid-egg", "warrior-dream", "cocoon", "whispering-root", "hotsprings", "stag", "tram", "mask", "vessel", "charm-notch", "lore", "key", "journal", "idol", "arcane-egg", "pale-ore", "seal"];
        let pin = mapping.indexOf(e.target.value);

        if (pin >= 0) {
          let t = {...this.state};
          t.selectedPin = pin;
          this.setState(t);
        }
      }, onKeyUp: (e) => {
        if (e.key === "Enter") {
          this.createOrUpdate();
        }
      } })),
      "Note: ",
      e("br"),
      e("div", { className: "d-inputrow" }, e("textarea", { ref: this.noteRef, defaultValue: this.props.pin ? this.props.pin.note : "" })),
      e("div", { className: "d-pin-list" }, pins),
      e("div", { className: "d-buttons"},
        e("div", { className: "d-button button", onClick: () => {
          this.createOrUpdate();
        } }, this.props.pin ? "Update" : "Create"),
        e("div", { className: "d-button button", onClick: () => {
          this.props.d.close();
        } }, "Cancel")
      )
    );
  }
}

/*
  Expects props:
  title: string
  msg: string
  ok: func

  Use reactDialog(ConfirmDialog, { props }) to instantiate
*/
class ConfirmDialog extends React.Component {
  render() {
    return e("div", { className: "dialog" },
      e("div", { className: "d-title" }, this.props.title),
      e("div", { className: "d-msg" }, this.props.msg),
      e("div", { className: "d-buttons"},
        e("div", { className: "d-button button", onClick: () => {
          this.props.d.close();
          this.props.ok();
        } }, "Ok"),
        e("div", { className: "d-button button", onClick: () => {
          this.props.d.close();
        } }, "Cancel")
      )
    );
  }
}


/*
  Expects React.Component class, not rendered object
*/
function reactDialog(contentClass, props) {
  let d = {};
  props.d = d;

  let l = (e) => {
    if (e.key === "Escape") {
      d.close();
    }
  };
  document.addEventListener("keyup", l);

  d.close = () => {
    document.removeEventListener("keyup", l);
    d.root.remove();
  };

  d.root = document.createElement("div");
  d.root.classList.add("dialog-root");
  d.root.addEventListener("click", (e) => {
    if (e.target === d.root) d.close();
  });
  document.body.appendChild(d.root);

  let content = e(contentClass, props);
  ReactDOM.render(content, d.root);

  return content;
}

function setCookie(cname, cvalue, exdays) {
  const d = new Date();
  d.setTime(d.getTime() + (exdays*24*60*60*1000));
  let expires = "expires="+ d.toUTCString();
  document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function getCookie(cname) {
  let name = cname + "=";
  let decodedCookie = decodeURIComponent(document.cookie);
  let ca = decodedCookie.split(';');
  for(let i = 0; i <ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) == ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length);
    }
  }
  return "";
}


// for (let i = 0; i < map.rooms.length; i++) {
//   delete map.rooms[i].notes;
// }


const appContainer = document.querySelector('#app-container');
ReactDOM.render(e(App), appContainer);
