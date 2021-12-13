
// Hi (:


// =============================================================================
// =============================================================================
// =============================================================================

$(() => {
  initMapRooms();
  initPanZoomers();

  $("#bestiary-button").on("click", () => {
    bestiaryDialog();
  });
  $("#filters-button").on("click", () => {
    let d = dialog();
    let t = document.createElement("textarea");
    t.style.width = "100%";
    t.style.height = "100%";
    t.value = "map = " + JSON.stringify(map).replaceAll("},{", "},\n{");
    d.content.append(t);
  });
});

let lastBestiary = 0;
let roomEMap = new Map();
let pinEMap = new Map();

// =============================================================================
// =============================================================================
// =============================================================================

function refreshPins() {
  let mapE = $("#map")[0];
  let usedPins = [];

  $.each(map.rooms, (_i, room) => {
    let roomE = roomEMap.get(room);
    if (!room.internal && room.notes != null) {
      $.each(room.notes, (_i, note) => {
        let pinE = pinEMap.get(note);

        if (pinE == null) {
          let img = document.createElement("img");
          img.classList.add("map-item");
          img.classList.add("map-pin");
          img.onmouseenter = (e) => {
            let r = img.getBoundingClientRect();
            let p = pinInfo(room, note, {x: r.right, y: r.bottom});

            let oldClose = p.close;
            p.close = () => {
              oldClose();
              img.removeEventListener("mouseleave", p.close);
            };

            img.addEventListener("mouseleave", p.close);
          };
          img.oncontextmenu = (e) => {
            e.preventDefault();
            contextMenu([
              { text: "Edit", onclick: () => { annotationEditDialog(room, note); } },
              { text: "Delete", onclick: () => {
                room.notes.splice(room.notes.indexOf(note), 1);
                refreshPins();
              } }
            ], {x: e.clientX, y: e.clientY});
          };
          mapE.append(img);
          pinE = img;
          pinEMap.set(note, pinE);
        }

        usedPins.push(pinE);

        pinE.style.left = room.x + (roomE.width * note.pos.x) + "px";
        pinE.style.top = room.y + (roomE.height * note.pos.y) + "px";
        pinE.src = note.pin;
      });
    }
  });

  // Remove unused pins
  pinEMap.forEach((v, k) => {
    if (!usedPins.includes(v)) {
      v.remove();
      pinEMap.delete(k);
    }
  });
}

function initMapRooms() {
  // Initialize map rooms from data
  let mapDiv = $("#map")[0]
  mapDiv.style.width = map.width + "px";
  mapDiv.style.height = map.height + "px";
  centerMap();
  $.each(map.rooms, (_i2, room) => {
    if (!room.internal) {
      let img = document.createElement("img");
      img.classList.add("map-item");
      img.style.left = room.x + "px";
      img.style.top = room.y + "px";
      img.id = room.name;
      img.src = room.src;
      img.title = img.id;
      img.onclick = (e) => {
        let x = e.offsetX / img.width;
        let y = e.offsetY / img.height;
        roomDialog(room, null, true, x, y);
      };

      roomEMap.set(room, img);

      mapDiv.append(img)
    }
  });

  refreshPins();
}



function initPanZoomers() {
  $(document).on("dragstart", ".panzoom-content", function () {
    return false;
  });
  $(".panzoom-container").each((_i, e) => {
    initPanZoomer(e)
  });
}

function initPanZoomer(container) {
  let content = container.querySelector(".panzoom-content");
  if (typeof(content) == "undefined") return;

  let offX = 0;
  let offY = 0;
  let dragging = false;
  let mousedown = false;
  let draggedThisClick = false;

  let panzoom = {
    start: (e) => {
      offX = e.clientX - (getOffset(content).left - getOffset(container).left - $(container).css("border-left-width").slice(0, -2));
      offY = e.clientY - (getOffset(content).top - getOffset(container).top - $(container).css("border-top-width").slice(0, -2));
      draggedThisClick = false;
      mousedown = true;
      e.stopPropagation();
    },
    stop: (e) => {
      mousedown = false;
      dragging = false;
    },
    drag: (e) => {
      if (mousedown) {
        dragging = true;
        draggedThisClick = true;
      }
      if (dragging) {
        content.style.left = (e.clientX - offX) + "px";
        content.style.top = (e.clientY - offY) + "px";
        e.stopPropagation();
      }
    },
    zoom: (e) => {
      e.preventDefault();
      console.log("scroll", e);
    }
  };

  container.addEventListener("mousedown", panzoom.start);
  document.addEventListener("mousemove", panzoom.drag);
  document.addEventListener("mouseup", panzoom.stop);
  container.addEventListener("wheel", panzoom.zoom);
  container.addEventListener("click", (e) => {
    if (draggedThisClick) e.stopPropagation();
  }, true);

  return panzoom
}

function getOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    left: rect.left + window.scrollX,
    top: rect.top + window.scrollY
  };
}

// Center content in map
function centerMap() {
  let c = $("#map")[0];
  c.style.left = ((c.parentElement.clientWidth / 2) - (map.width / 2)) + "px";
  c.style.top = ((c.parentElement.clientHeight / 2) - (map.height / 2)) + "px";
}

function contextMenu(options, pos) {
  let p = popup(pos);
  p.root.classList.add("contextmenu");
  $.each(options, (_i, option) => {
    let o = document.createElement("div");
    o.classList.add("cm-option");
    o.textContent = option.text;
    o.onclick = option.onclick;
    p.root.append(o);
  });

  let oldClose = p.close;
  p.close = () => {
    oldClose();
    document.removeEventListener("click", p.close);
  };
  document.addEventListener("click", p.close, true);

  return p;
}

function pinInfo(room, note, pos) {
  let p = popup(pos);

  let d = document.createElement("div");
  d.classList.add("row-flex");
  p.root.append(d);
  let i = document.createElement("img");
  i.src = note.pin;
  d.append(i);
  let d2 = document.createElement("div");
  d2.classList.add("font-small");
  d2.innerHTML = "ID: " + note.id + "<br>Type: " + note.type + "<br>Room: " + room.name;
  d.append(d2);

  if (note.note != null && note.note !== "") {
    let d3 = document.createElement("div");
    d3.classList.add("font-small");
    d3.style.borderTop = "solid 1px white";
    d3.style.padding = "10px";
    d3.innerHTML = note.note;
    p.root.append(d3);
  }

  let oldClose = p.close;
  p.close = () => {
    oldClose();
    document.removeEventListener("click", p.close);
  };
  document.addEventListener("click", p.close, true);

  return p;
}

function exitInfo(room, exit, pos) {
  let p = popup(pos);

  let d = document.createElement("div");
  d.classList.add("font-small");
  d.innerHTML = "Exit to: " + exit.to + "<br>From: " + room.name + ":" + (room.exits.indexOf(exit));
  p.root.append(d);

  if (exit.note != null && exit.note !== "") {
    let d2 = document.createElement("div");
    d2.classList.add("font-small");
    d2.style.borderTop = "solid 1px white";
    d2.style.padding = "10px";
    d2.innerHTML = exit.note;
    p.root.append(d2);
  }

  let oldClose = p.close;
  p.close = () => {
    oldClose();
    document.removeEventListener("click", p.close);
  };
  document.addEventListener("click", p.close, true);

  return p;
}

function popup(pos) {
  let root = document.createElement("div");
  root.classList.add("popup");
  root.style.left = pos.x + "px";
  root.style.top = pos.y + "px";
  document.body.append(root);

  let close = null;
  close = () => {
    root.remove();
  };

  return { root: root, close: close };
}

function roomExitDialog(room, pos, exit=null, add_to_dom=true) {
  let d = dialog(add_to_dom);
  d.content.classList.add("exits-dialog");
  d.content.classList.add("col-flex");

  let title = document.createElement("h2");
  title.textContent = "Create Exit";
  d.content.append(title);

  d.content.append(document.createTextNode("Exits to:"));
  d.to = document.createElement("input");
  d.to.type = "text";
  d.to.onkeypress = (e) => {
    if (e.key == "Enter") d.save.click();
  };
  if (exit != null) d.to.value = exit.to;
  d.content.append(d.to);
  d.to.focus();
  d.content.append(document.createElement("br"));

  d.content.append(document.createTextNode("Note:"));
  d.text = document.createElement("textarea");
  d.text.classList.add("exits-text");
  if (exit != null) d.text.value = exit.note;
  d.content.append(d.text);
  d.content.append(document.createElement("br"));

  let dir = document.createElement("div");
  dir.classList.add("row-flex");
  d.content.append(dir);
  let left = document.createElement("img");
  left.classList.add("exits-dir");
  if ((exit == null && pos.x < 0.5 && pos.x < pos.y && pos.x < 1-pos.y) || (exit != null && exit.direction == "left")) left.classList.add("exits-selected-dir");
  left.src = "assets/inventory/RT_LT_arrow.png";
  left.style.transform = "rotate(180deg)";
  left.onclick = () => {
    $(".exits-selected-dir", dir).removeClass("exits-selected-dir");
    left.classList.add("exits-selected-dir");
  };
  dir.append(left);
  let up = document.createElement("img");
  up.classList.add("exits-dir");
  if ((exit == null && pos.y < 0.5 && pos.y < pos.x && pos.y < 1-pos.x) || (exit != null && exit.direction == "up")) up.classList.add("exits-selected-dir");
  up.src = "assets/inventory/RT_LT_arrow.png";
  up.style.transform = "rotate(-90deg)";
  up.onclick = () => {
    $(".exits-selected-dir", dir).removeClass("exits-selected-dir");
    up.classList.add("exits-selected-dir");
  };
  dir.append(up);
  let right = document.createElement("img");
  right.classList.add("exits-dir");
  if ((exit == null && 1-pos.x < 0.5 && 1-pos.x < pos.y && 1-pos.x < 1-pos.y) || (exit != null && exit.direction == "right")) right.classList.add("exits-selected-dir");
  right.src = "assets/inventory/RT_LT_arrow.png";
  right.onclick = () => {
    $(".exits-selected-dir", dir).removeClass("exits-selected-dir");
    right.classList.add("exits-selected-dir");
  };
  dir.append(right);
  let down = document.createElement("img");
  down.classList.add("exits-dir");
  if ((exit == null && 1-pos.y < 0.5 && 1-pos.y < pos.x && 1-pos.y < 1-pos.x) || (exit != null && exit.direction == "down")) down.classList.add("exits-selected-dir");
  down.src = "assets/inventory/RT_LT_arrow.png";
  down.style.transform = "rotate(90deg)";
  down.onclick = () => {
    $(".exits-selected-dir", dir).removeClass("exits-selected-dir");
    down.classList.add("exits-selected-dir");
  };
  dir.append(down);
  let none = document.createElement("img");
  none.classList.add("exits-dir");
  none.src = "assets/misc/thing.png";
  none.onclick = () => {
    $(".exits-selected-dir", dir).removeClass("exits-selected-dir");
    none.classList.add("exits-selected-dir");
  };
  dir.append(none);

  let div = document.createElement("div");
  div.classList.add("row-flex");
  d.content.append(div);
  d.save = document.createElement("input");
  d.save.type = "button";
  d.save.value = "Save";
  d.save.style.marginRight = "10px";
  d.save.onclick = () => {
    let direction = "none";
    if (left.classList.contains("exits-selected-dir")) {
      direction = "left";
    } else if (up.classList.contains("exits-selected-dir")) {
      direction = "up";
    } else if (right.classList.contains("exits-selected-dir")) {
      direction = "right";
    } else if (down.classList.contains("exits-selected-dir")) {
      direction = "down";
    }

    if (exit == null) {
      let result = { to: d.to.value, note: d.text.value, x: pos.x, y: pos.y, direction: direction }
      if (room.exits == undefined) room.exits = [];
      room.exits.push(result);
    } else {
      exit.to = d.to.value;
      exit.note = d.text.value;
      exit.direction = direction;
    }

    d.close();
  };
  div.append(d.save);
  let cancel = document.createElement("input");
  cancel.type = "button";
  cancel.value = "Cancel";
  cancel.onclick = () => {
    d.close();
  };
  div.append(cancel);

  return d;
}

function roomDialog(room, entry=null, add_to_dom=true, x=null, y=null) {
  let d = dialog(add_to_dom);
  d.content.classList.add("panzoom-container");
  let p = document.createElement("div");
  p.classList.add("panzoom-content");
  d.content.append(p);
  initPanZoomer(d.content);

  let refreshExits = () => {
    $(".room-exit", p).remove();
    $.each(room.exits, (_i, exit) => {
      let eImg = document.createElement("img");
      eImg.classList.add("map-item");
      eImg.classList.add("room-exit");
      eImg.src = exit.direction == "none" ? "assets/misc/thing.png" : "assets/inventory/RT_LT_arrow.png";
      if (exit.direction == "left") {
        eImg.style.transform = "translate(-50%, -50%) rotate(180deg)";
      } else if (exit.direction == "up") {
        eImg.style.transform = "translate(-50%, -50%) rotate(-90deg)";
      } else if (exit.direction == "down") {
        eImg.style.transform = "translate(-50%, -50%) rotate(90deg)";
      }
      let r = d.img.getBoundingClientRect();
      eImg.style.left = (r.width * exit.x) + "px";
      eImg.style.top = (r.height * exit.y) + "px";
      eImg.onmouseenter = (e) => {
        let r = eImg.getBoundingClientRect();
        let p = exitInfo(room, exit, {x: r.right, y: r.bottom});

        let oldClose = p.close;
        p.close = () => {
          oldClose();
          eImg.removeEventListener("mouseleave", p.close);
        };

        eImg.addEventListener("mouseleave", p.close);
      };
      eImg.oncontextmenu = (e) => {
        e.preventDefault();
        contextMenu([
          {text: "edit", onclick: () => {
            roomExitDialog(room, {x:exit.x, y:exit.y}, exit);
          }},
          {text: "Delete", onclick: () => {
            room.exits.splice(room.exits.indexOf(exit), 1);
            refreshExits();
          }},
        ], {x: e.clientX, y: e.clientY});
      };
      eImg.onclick = () => {
        d.close();
        // TODO go to room
        let s = exit.to.split(":");
        let id = s[0];
        let entry = s.length > 1 ? parseInt(s[1]) : null;
        let newRoom = null;

        $.each(map.rooms, (_i, room) => {
          if (room.name == id) {
            newRoom = room;
            return false;
          }
        });

        if (newRoom != null) roomDialog(newRoom, entry);
      };
      p.append(eImg);
    });
  };

  d.img = document.createElement("img");
  d.img.oncontextmenu = (e) => {
    e.preventDefault();
    contextMenu([
      {text:"Pin", onclick: () => {
        let r = d.img.getBoundingClientRect();
        annotationDialog(room, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
      }},
      {text:"Exit", onclick: () => {
        let r = d.img.getBoundingClientRect();
        let d2 = roomExitDialog(room, { x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
        let oldClick = d2.save.onclick;
        d2.save.onclick = () => {
          oldClick();

          refreshExits();
        };
      }}
    ], {x:e.clientX, y:e.clientY});
  };
  p.append(d.img);
  d.img.onload = () => {
    refreshExits();

    if (room.exits != null && room.exits.length > 0) {
      if (entry == null || entry < 0 || entry >= room.exits.length) entry = 0;

      let exit = room.exits[entry];
      let r = d.content.getBoundingClientRect();
      let rp = d.img.getBoundingClientRect();

      let x = (-rp.width * exit.x + r.width/2);
      let y = (-rp.height * exit.y + r.height/2);

      let centerX = r.width / 2 - rp.width / 2;
      let centerY = r.height / 2 - rp.height / 2;

      const over = 50;
      if (exit.direction == "left") x = Math.max(Math.min(x, over), centerX);
      else if (exit.direction == "right") x = Math.min(Math.max(x, -(rp.width - r.width + over)), centerX);
      else if (exit.direction == "up") y = Math.max(Math.min(y, over), centerY);
      else if (exit.direction == "down") y = Math.min(Math.max(y, -(rp.height - r.height + over)), centerY);

      p.style.left = x + "px";
      p.style.top = y + "px";
    }
  };
  d.img.src = "assets/rooms/" + room.name + ".jpg";

  d.room = room;

  return d;
}

function bestiaryDialog(id=null, add_to_dom=true) {
  let d = dialog(add_to_dom);
  d.content.classList.add("row-flex");
  d.content.classList.add("bestiary-dialog");

  d.beast = null;

  d.list = document.createElement("div");
  d.list.classList.add("bestiary-list");
  d.content.append(d.list);
  let pre = document.createElement("div");
  pre.classList.add("bestiary-img-container");
  d.img = document.createElement("img");
  pre.append(d.img);
  d.content.append(pre);
  let textdiv = document.createElement("div");
  textdiv.classList.add("bestiary-preview-text");
  d.content.append(textdiv);
  d.title = document.createElement("h1");
  textdiv.append(d.title);
  d.desc = document.createElement("div");
  textdiv.append(d.desc);
  textdiv.append(document.createElement("br"));
  let himg = document.createElement("img");
  himg.src = "assets/inventory/hunter_symbol.png";
  textdiv.append(himg);
  d.note = document.createElement("div");
  textdiv.append(d.note);

  $.each(bestiary, (i, beast) => {
    let div = document.createElement("div");
    div.classList.add("row-flex");
    div.classList.add("bestiary-list-item");
    div.onclick = () => {
      d.img.src = "assets/bestiary/previews/" + beast.preview;
      d.title.innerHTML = beast.name;
      d.desc.innerHTML = beast.desc;
      d.note.innerHTML = beast.note;
      lastBestiary = i;
      d.beast = i;
    };
    d.list.append(div);

    let img = document.createElement("img");
    img.src = "assets/bestiary/icons/" + beast.icon;
    div.append(img);

    let text = document.createElement("div");
    text.style.flex = "1";
    text.textContent = beast.name;
    div.append(text);

    if ((id == null && i == lastBestiary) || id == beast.id) {
      div.click();
    }
  });

  return d;
}

function annotationDialog(room, pos, add_to_dom = true) {
  let d = dialog(add_to_dom);
  d.content.classList.add("col-flex");
  d.content.classList.add("annotation-dialog");

  let title = document.createElement("h2");
  title.textContent = "Annotate";
  d.content.append(title);

  d.content.append(document.createTextNode("ID:"));
  d.id = document.createElement("input");
  d.id.type = "text";
  d.content.append(d.id);
  d.content.append(document.createElement("br"));

  d.content.append(document.createTextNode("Type:"));
  d.type = document.createElement("input");
  d.type.type = "text";
  d.content.append(d.type);
  d.content.append(document.createElement("br"));

  d.content.append(document.createTextNode("Note:"));
  d.text = document.createElement("textarea");
  d.text.classList.add("annotation-text");
  d.content.append(d.text);
  d.content.append(document.createElement("br"));

  d.content.append(document.createTextNode("Pin:"));
  d.pins = document.createElement("div");
  d.pin = map.pins[0];
  d.pins.classList.add("row-flex");
  d.pins.style.flexWrap = "wrap";
  d.pins.style.overflowY = "auto";
  $.each(map.pins, (_i, pin) => {
    let p = document.createElement("img");
    p.src = pin;
    p.width = 64;
    p.style.margin = "5px";
    p.onclick = () => {
      $.each(d.pins.children, (_i, pin2) => {
        pin2.classList.remove("annotation-selected-pin");
      });
      p.classList.add("annotation-selected-pin");
      d.pin = pin;
    };
    if (d.pin == pin) p.classList.add("annotation-selected-pin");
    d.pins.append(p);
  });
  d.content.append(d.pins);
  d.content.append(document.createElement("br"));

  let div = document.createElement("div");
  div.classList.add("row-flex");
  d.content.append(div);
  d.save = document.createElement("input");
  d.save.type = "button";
  d.save.value = "Save";
  d.save.style.marginRight = "10px";
  d.save.onclick = () => {
    createAnnotation(room, pos, d.id.value, d.type.value, d.text.value, d.pin);
    d.close();
  };
  div.append(d.save);
  let cancel = document.createElement("input");
  cancel.type = "button";
  cancel.value = "Cancel";
  cancel.onclick = () => {
    d.close();
  };
  div.append(cancel);

  return d;
}

function annotationEditDialog(room, note, add_to_dom=true) {
  let d = annotationDialog(room, note.pos, add_to_dom);
  d.id.value = note.id;
  d.type.value = note.type;
  d.text.value = note.note;
  d.pins.children[map.pins.indexOf(note.pin)].click();

  d.save.onclick = () => {
    note.id = d.id.value;
    note.type = d.type.value;
    note.note = d.text.value;
    note.pin = d.pin;
    d.close();
    refreshPins();
  };

  return d;
}

function createAnnotation(room, pos, id, type, text, pin) {
  let note = { id: id, type: type, note: text, pin: pin, pos: pos };
  if (room.notes == null) room.notes = [];
  room.notes.push(note);

  refreshPins();
}

function dialog(add_to_dom = true) {
  let close = null;

  let root = document.createElement("div");
  root.classList.add("dialog-root");

  let tint = document.createElement("div");
  tint.classList.add("dialog-tint");
  tint.onclick = () => {
    close();
  };
  root.append(tint);

  let content = document.createElement("div");
  content.classList.add("dialog");
  root.append(content);

  close = () => {
    root.remove();
  };

  if (add_to_dom) document.body.append(root);

  return { content: content, root: root, close: close }
}
