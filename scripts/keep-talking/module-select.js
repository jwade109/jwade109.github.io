let select = document.getElementById("module-select");

select.innerHTML =
    "<div style='height: 30px'></div>" +
    "<select id='module' onchange='loadnew()'>" +
      "<option selected>Load a new Module</option>" +
      "<option value='home'>See all modules</option>" +
      "<option value='morse-code.html'>Morse Code</option>" +
      "<option value='passwords.html'>Passwords</option>" +
      "<option value='mazes.html'>Mazes</option>" +
    "</select>";

let module = document.getElementById("module");

function loadnew()
{
    console.log(module.value);
    if (module.value == 'home') window.location.href = '../keep-talking.html';
    else window.location.href = module.value;
}
