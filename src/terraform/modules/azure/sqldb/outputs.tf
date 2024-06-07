output "sql_server_ids" {
  value = azurerm_sql_server.sql_server.*.id
}

output "sql_database_ids" {
  value = azurerm_sql_database.sql_database.*.id
}
