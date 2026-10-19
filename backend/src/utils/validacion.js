// Utilidades de validación

// Valida RUT chileno (módulo 11).
function validarRut(rut) {
  if (!rut || typeof rut !== "string") return false;
  const limpio = rut.replace(/\./g, "").replace(/-/g, "").toUpperCase();
  if (limpio.length < 2) return false;
  const cuerpo = limpio.slice(0, -1);
  const dv = limpio.slice(-1);
  if (!/^\d+$/.test(cuerpo)) return false;
  let suma = 0;
  let multiplo = 2;
  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += parseInt(cuerpo[i], 10) * multiplo;
    multiplo = multiplo === 7 ? 2 : multiplo + 1;
  }
  const resto = 11 - (suma % 11);
  const dvEsperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);
  return dv === dvEsperado;
}

function esEmail(valor) {
  return typeof valor === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(valor);
}

function requerirCampos(obj, campos) {
  const faltan = campos.filter(
    (c) => obj[c] === undefined || obj[c] === null || obj[c] === ""
  );
  return faltan;
}

module.exports = { validarRut, esEmail, requerirCampos };
