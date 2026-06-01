// Endpoints centralizados - todos usan rutas relativas
// En desarrollo: el proxy (setupProxy.js) redirige /api → comitedeaguasangaspartl.com
// En producción: misma URL base, sin cambios necesarios

export const API = {
  // SELECT
  SELECT:               "/api/Selectgeneric/Select_Gen.php",
  SELECT_JOIN:          "/api/Selectgeneric/SelectWithJoin.php",
  SELECT_WHERE:         "/api/Selectgeneric/SelectWithWhere.php",
  SELECT_CLIENTES_LOGIN:"/api/Selectgeneric/clientes_login_join.php",
  GET_ADEUDOS:          "/api/Selectgeneric/get_adeudos.php",

  // INSERT
  INSERT:               "/api/Insertgeneric/insert.php",
  INSERT_USER_ADMIN:    "/api/Insertgeneric/insert_user_admin.php",
  IMPORT_CSV:           "/api/Insertgeneric/importUserCsv.php",
  GENERAR_ADEUDOS:      "/api/Insertgeneric/generar_adeudos.php",

  // UPDATE
  UPDATE:               "/api/Updategeneric/update_generic.php",
  UPDATE_USER_ADMIN:    "/api/Updategeneric/user_update_admin.php",

  // AUTH
  LOGIN_ADMIN:          "/api/login_admin.php",
  LOGIN_CLIENTE:        "/api/login_cliente.php",
  LOGOUT:               "/api/logout.php",
  FORGOT_PASSWORD:      "/api/forgot_password.php",
  RESET_PASSWORD:       "/api/reset_password.php",

  // OTROS
  DASHBOARD:            "/api/dashboard/GeneralDashboard.php",
  SEND_MAIL:            "/api/send_mail.php",

  // MAPA
  MAPA_BUSCAR_CONTRATO:     "/api/mapa/buscar_contrato.php",
  MAPA_GUARDAR_UBICACION:   "/api/mapa/guardar_ubicacion.php",
  MAPA_OBTENER_UBICACIONES: "/api/mapa/obtener_ubicaciones.php",
  MAPA_IMPORTAR_KML:        "/api/mapa/importar_kml.php",
  MAPA_LIMPIAR:             "/api/mapa/limpiar_ubicaciones.php",
};
