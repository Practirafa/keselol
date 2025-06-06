#!/usr/bin/env python3
import json
import os
import sys
import time
import datetime
import argparse
import logging
from colorama import Fore, Style, init

# Inicializar colorama para colores en la terminal
init(autoreset=True)

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("admin_balance.log"),
        logging.StreamHandler()
    ]
)

class AdminBalanceManager:
    def __init__(self, users_file='jorlingUsers.json'):
        self.users_file = users_file
        self.users = self.load_users()
        self.transaction_log_file = 'transaction_log.json'
        self.transactions = self.load_transactions()
    
    def load_users(self):
        """Cargar usuarios desde el archivo JSON"""
        try:
            if os.path.exists(self.users_file):
                with open(self.users_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            else:
                print(f"{Fore.YELLOW}Archivo de usuarios no encontrado: {self.users_file}")
                print(f"{Fore.YELLOW}Buscando en localStorage...")
                
                # Intentar cargar desde localStorage (simulado)
                local_storage_file = 'localStorage.json'
                if os.path.exists(local_storage_file):
                    with open(local_storage_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        if 'jorlingUsers' in data:
                            return data['jorlingUsers']
                
                print(f"{Fore.RED}No se encontraron datos de usuarios. Creando archivo vacío.")
                return []
        except Exception as e:
            logging.error(f"Error al cargar usuarios: {e}")
            return []
    
    def save_users(self):
        """Guardar usuarios en el archivo JSON"""
        try:
            with open(self.users_file, 'w', encoding='utf-8') as f:
                json.dump(self.users, f, indent=2)
            
            # También actualizar localStorage simulado
            try:
                local_storage_file = 'localStorage.json'
                if os.path.exists(local_storage_file):
                    with open(local_storage_file, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                    
                    data['jorlingUsers'] = self.users
                    
                    with open(local_storage_file, 'w', encoding='utf-8') as f:
                        json.dump(data, f, indent=2)
            except:
                pass  # Si falla la actualización del localStorage, continuamos
                
            logging.info(f"Usuarios guardados correctamente en {self.users_file}")
            return True
        except Exception as e:
            logging.error(f"Error al guardar usuarios: {e}")
            return False
    
    def load_transactions(self):
        """Cargar historial de transacciones"""
        try:
            if os.path.exists(self.transaction_log_file):
                with open(self.transaction_log_file, 'r', encoding='utf-8') as f:
                    return json.load(f)
            return []
        except Exception as e:
            logging.error(f"Error al cargar transacciones: {e}")
            return []
    
    def save_transaction(self, transaction):
        """Guardar una transacción en el historial"""
        try:
            self.transactions.append(transaction)
            with open(self.transaction_log_file, 'w', encoding='utf-8') as f:
                json.dump(self.transactions, f, indent=2)
            return True
        except Exception as e:
            logging.error(f"Error al guardar transacción: {e}")
            return False
    
    def find_user(self, identifier):
        """Buscar un usuario por nombre de usuario o correo electrónico"""
        for user in self.users:
            if user['username'].lower() == identifier.lower() or user['email'].lower() == identifier.lower():
                return user
        return None
    
    def add_balance(self, identifier, amount):
        """Añadir saldo a un usuario"""
        user = self.find_user(identifier)
        if not user:
            print(f"{Fore.RED}Usuario no encontrado: {identifier}")
            return False
        
        try:
            amount = float(amount)
            if amount <= 0:
                print(f"{Fore.RED}El monto debe ser mayor que cero")
                return False
            
            old_balance = user.get('balance', 0)
            user['balance'] = old_balance + amount
            
            # Registrar transacción
            transaction = {
                'user_id': user.get('id'),
                'username': user.get('username'),
                'type': 'deposit',
                'amount': amount,
                'old_balance': old_balance,
                'new_balance': user['balance'],
                'timestamp': datetime.datetime.now().isoformat(),
                'admin_note': f"Recarga administrativa"
            }
            
            self.save_transaction(transaction)
            
            if self.save_users():
                print(f"{Fore.GREEN}Saldo añadido correctamente")
                print(f"{Fore.GREEN}Usuario: {user['username']}")
                print(f"{Fore.GREEN}Saldo anterior: ${old_balance:.2f}")
                print(f"{Fore.GREEN}Monto añadido: ${amount:.2f}")
                print(f"{Fore.GREEN}Nuevo saldo: ${user['balance']:.2f}")
                return True
            else:
                print(f"{Fore.RED}Error al guardar los cambios")
                return False
                
        except ValueError:
            print(f"{Fore.RED}Monto inválido: {amount}")
            return False
    
    def subtract_balance(self, identifier, amount):
        """Restar saldo a un usuario"""
        user = self.find_user(identifier)
        if not user:
            print(f"{Fore.RED}Usuario no encontrado: {identifier}")
            return False
        
        try:
            amount = float(amount)
            if amount <= 0:
                print(f"{Fore.RED}El monto debe ser mayor que cero")
                return False
            
            old_balance = user.get('balance', 0)
            
            if old_balance < amount:
                print(f"{Fore.RED}Saldo insuficiente")
                print(f"{Fore.RED}Saldo actual: ${old_balance:.2f}")
                print(f"{Fore.RED}Monto a restar: ${amount:.2f}")
                return False
            
            user['balance'] = old_balance - amount
            
            # Registrar transacción
            transaction = {
                'user_id': user.get('id'),
                'username': user.get('username'),
                'type': 'withdrawal',
                'amount': amount,
                'old_balance': old_balance,
                'new_balance': user['balance'],
                'timestamp': datetime.datetime.now().isoformat(),
                'admin_note': f"Retiro administrativo"
            }
            
            self.save_transaction(transaction)
            
            if self.save_users():
                print(f"{Fore.GREEN}Saldo restado correctamente")
                print(f"{Fore.GREEN}Usuario: {user['username']}")
                print(f"{Fore.GREEN}Saldo anterior: ${old_balance:.2f}")
                print(f"{Fore.GREEN}Monto restado: ${amount:.2f}")
                print(f"{Fore.GREEN}Nuevo saldo: ${user['balance']:.2f}")
                return True
            else:
                print(f"{Fore.RED}Error al guardar los cambios")
                return False
                
        except ValueError:
            print(f"{Fore.RED}Monto inválido: {amount}")
            return False
    
    def list_users(self):
        """Listar todos los usuarios con su saldo"""
        if not self.users:
            print(f"{Fore.YELLOW}No hay usuarios registrados")
            return
        
        print(f"\n{Fore.CYAN}=== USUARIOS REGISTRADOS ===")
        print(f"{Fore.CYAN}{'ID':<5} {'Usuario':<20} {'Email':<30} {'Saldo':<10} {'Pedidos':<8}")
        print(f"{Fore.CYAN}{'-'*73}")
        
        for user in self.users:
            user_id = user.get('id', 'N/A')
            username = user.get('username', 'N/A')
            email = user.get('email', 'N/A')
            balance = user.get('balance', 0)
            orders = len(user.get('orders', []))
            
            print(f"{user_id:<5} {username:<20} {email:<30} ${balance:<9.2f} {orders:<8}")
    
    def get_user_details(self, identifier):
        """Mostrar detalles completos de un usuario"""
        user = self.find_user(identifier)
        if not user:
            print(f"{Fore.RED}Usuario no encontrado: {identifier}")
            return
        
        print(f"\n{Fore.CYAN}=== DETALLES DEL USUARIO ===")
        print(f"{Fore.CYAN}ID: {user.get('id', 'N/A')}")
        print(f"{Fore.CYAN}Usuario: {user.get('username', 'N/A')}")
        print(f"{Fore.CYAN}Email: {user.get('email', 'N/A')}")
        print(f"{Fore.CYAN}Saldo: ${user.get('balance', 0):.2f}")
        print(f"{Fore.CYAN}Fecha de registro: {user.get('createdAt', 'N/A')}")
        
        orders = user.get('orders', [])
        if orders:
            print(f"\n{Fore.CYAN}=== PEDIDOS DEL USUARIO ===")
            print(f"{Fore.CYAN}{'ID':<10} {'Servicio':<20} {'Cantidad':<10} {'Precio':<10} {'Estado':<15} {'Fecha':<20}")
            print(f"{Fore.CYAN}{'-'*85}")
            
            for order in orders:
                order_id = order.get('id', 'N/A')
                service = order.get('service', 'N/A')
                quantity = order.get('quantity', 0)
                price = order.get('price', 0)
                status = order.get('status', 'N/A')
                date = order.get('createdAt', 'N/A')
                
                print(f"{order_id:<10} {service:<20} {quantity:<10} ${price:<9.2f} {status:<15} {date:<20}")
        else:
            print(f"\n{Fore.YELLOW}El usuario no tiene pedidos")
    
    def bulk_add_balance(self, amount):
        """Añadir saldo a todos los usuarios"""
        if not self.users:
            print(f"{Fore.YELLOW}No hay usuarios registrados")
            return
        
        try:
            amount = float(amount)
            if amount <= 0:
                print(f"{Fore.RED}El monto debe ser mayor que cero")
                return
            
            print(f"{Fore.YELLOW}¿Estás seguro de añadir ${amount:.2f} a TODOS los usuarios? (s/n)")
            confirm = input().lower()
            
            if confirm != 's':
                print(f"{Fore.YELLOW}Operación cancelada")
                return
            
            success_count = 0
            for user in self.users:
                old_balance = user.get('balance', 0)
                user['balance'] = old_balance + amount
                
                # Registrar transacción
                transaction = {
                    'user_id': user.get('id'),
                    'username': user.get('username'),
                    'type': 'deposit',
                    'amount': amount,
                    'old_balance': old_balance,
                    'new_balance': user['balance'],
                    'timestamp': datetime.datetime.now().isoformat(),
                    'admin_note': f"Recarga masiva"
                }
                
                self.save_transaction(transaction)
                success_count += 1
            
            if self.save_users():
                print(f"{Fore.GREEN}Saldo añadido correctamente a {success_count} usuarios")
                return True
            else:
                print(f"{Fore.RED}Error al guardar los cambios")
                return False
                
        except ValueError:
            print(f"{Fore.RED}Monto inválido: {amount}")
            return False
    
    def show_menu(self):
        """Mostrar menú principal"""
        while True:
            print(f"\n{Fore.CYAN}=== ADMINISTRACIÓN DE SALDOS JORLING SEGUIDORES ===")
            print(f"{Fore.WHITE}1. Añadir saldo a un usuario")
            print(f"{Fore.WHITE}2. Restar saldo a un usuario")
            print(f"{Fore.WHITE}3. Listar usuarios")
            print(f"{Fore.WHITE}4. Ver detalles de un usuario")
            print(f"{Fore.WHITE}5. Añadir saldo a todos los usuarios")
            print(f"{Fore.WHITE}6. Recargar datos de usuarios")
            print(f"{Fore.WHITE}0. Salir")
            
            try:
                option = int(input(f"{Fore.YELLOW}Selecciona una opción: "))
                
                if option == 1:
                    identifier = input(f"{Fore.YELLOW}Ingresa el nombre de usuario o email: ")
                    amount = input(f"{Fore.YELLOW}Ingresa el monto a añadir: ")
                    self.add_balance(identifier, amount)
                
                elif option == 2:
                    identifier = input(f"{Fore.YELLOW}Ingresa el nombre de usuario o email: ")
                    amount = input(f"{Fore.YELLOW}Ingresa el monto a restar: ")
                    self.subtract_balance(identifier, amount)
                
                elif option == 3:
                    self.list_users()
                
                elif option == 4:
                    identifier = input(f"{Fore.YELLOW}Ingresa el nombre de usuario o email: ")
                    self.get_user_details(identifier)
                
                elif option == 5:
                    amount = input(f"{Fore.YELLOW}Ingresa el monto a añadir a todos los usuarios: ")
                    self.bulk_add_balance(amount)
                
                elif option == 6:
                    self.users = self.load_users()
                    print(f"{Fore.GREEN}Datos de usuarios recargados")
                
                elif option == 0:
                    print(f"{Fore.GREEN}¡Hasta pronto!")
                    break
                
                else:
                    print(f"{Fore.RED}Opción inválida")
                    
            except ValueError:
                print(f"{Fore.RED}Por favor, ingresa un número válido")
            
            except KeyboardInterrupt:
                print(f"\n{Fore.GREEN}¡Hasta pronto!")
                break

def main():
    parser = argparse.ArgumentParser(description='Administrador de saldos para Jorling Seguidores')
    parser.add_argument('--file', help='Archivo JSON de usuarios', default='jorlingUsers.json')
    parser.add_argument('--add', help='Añadir saldo a un usuario (formato: usuario:monto)')
    parser.add_argument('--subtract', help='Restar saldo a un usuario (formato: usuario:monto)')
    parser.add_argument('--list', action='store_true', help='Listar todos los usuarios')
    parser.add_argument('--details', help='Ver detalles de un usuario')
    parser.add_argument('--bulk-add', help='Añadir saldo a todos los usuarios')
    
    args = parser.parse_args()
    
    manager = AdminBalanceManager(args.file)
    
    if args.add:
        try:
            user, amount = args.add.split(':')
            manager.add_balance(user, amount)
        except ValueError:
            print(f"{Fore.RED}Formato incorrecto. Usa --add usuario:monto")
    
    elif args.subtract:
        try:
            user, amount = args.subtract.split(':')
            manager.subtract_balance(user, amount)
        except ValueError:
            print(f"{Fore.RED}Formato incorrecto. Usa --subtract usuario:monto")
    
    elif args.list:
        manager.list_users()
    
    elif args.details:
        manager.get_user_details(args.details)
    
    elif args.bulk_add:
        manager.bulk_add_balance(args.bulk_add)
    
    else:
        manager.show_menu()

if __name__ == "__main__":
    main()
