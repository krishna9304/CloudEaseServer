output "resource_group_id" {
  value = module.resource_group.id
}

output "vnet_id" {
  value = module.vnet.id
}

output "subnet_id" {
  value = module.subnet.id
}

output "linux_vm_ids" {
  value = [for vm in module.linux_vm : vm.id]
}

output "storage_account_ids" {
  value = [for storage in module.storage : storage.id]
}

output "mongodb_ids" {
  value = [for mongodb in module.mongodb : mongodb.id]
}