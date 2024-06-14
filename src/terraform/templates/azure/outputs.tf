output "resource_group_id" {
  value = module.resource_group.id
}

output "vnet_id" {
  value = module.vnet.id
}

output "subnet_id" {
  value = module.subnet.id
}

output "public_ip_ids" {
  value = [for pubip in module.public_ip : pubip.id]
}

output "vm_ids" {
  value = [for vm in module.vm : vm.id]
}

output "storage_account_ids" {
  value = [for storage in module.storage : storage.id]
}

output "cosmosdb_ids" {
  value = [for cosmosdb in module.cosmosdb : cosmosdb.id]
}
