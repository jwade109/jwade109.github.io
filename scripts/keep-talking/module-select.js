let select = document.getElementById("module-select");

select.innerHTML =
    "<div style='height: 30px'></div>" +
    "<select id='module' onchange='loadnew()'>" +
      "<option selected>Load a new Module</option>" +
      "<option value='morse-code'>Morse Code</option>" +
      "<option value='passwords'>Passwords</option>" +
    "</select>";

let module = document.getElementById("module");

function loadnew()
{
    console.log("Switching to " + module.value);
    window.location.href = module.value;
}
