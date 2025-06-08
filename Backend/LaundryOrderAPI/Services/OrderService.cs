using LaundryOrderAPI.Data;
using LaundryOrderAPI.DTO;
using LaundryOrderAPI.Models;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace LaundryOrderAPI.Services
{    public interface IOrderService
    {
        Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto orderDto, string userId);
        Task<OrderResponseDto> GetOrderByIdAsync(int id);
        Task<IEnumerable<OrderResponseDto>> GetAllOrdersAsync();
        Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(string userId);
        Task<OrderResponseDto> UpdateOrderStatusAsync(int id, OrderUpdateStatusDto updateDto);
        Task<IEnumerable<OrderResponseDto>> GetPendingOrdersAsync();
        
        // Nouvelles méthodes pour les statistiques
        Task<int> GetOrderCountAsync();
        Task<int> GetOrderCountByStatusAsync(OrderStatus status);
        Task<IEnumerable<OrderResponseDto>> GetRecentOrdersAsync(int count);
    }
    
    public class OrderService : IOrderService
    {
        private readonly ApplicationDbContext _context;
        
        public OrderService(ApplicationDbContext context)
        {
            _context = context;
        }
        
        public async Task<OrderResponseDto> CreateOrderAsync(OrderCreateDto orderDto, string userId)
        {
            var order = new Order
            {
                OrderDate = orderDto.OrderDate,
                CustomerName = orderDto.CustomerName,
                CustomerSurname = orderDto.CustomerSurname,
                Comment = orderDto.Comment,
                Reason = orderDto.Reason,
                UserId = userId,
                LaundryItems = orderDto.LaundryItems.Select(i => new LaundryItem
                {
                    Name = i.Name,
                    Price = i.Price,
                    Description = i.Description
                }).ToList()
            };
            
            _context.Orders.Add(order);
            await _context.SaveChangesAsync();
            
            return MapOrderToDto(order);
        }
        
        public async Task<OrderResponseDto> GetOrderByIdAsync(int id)
        {
            var order = await _context.Orders
                .Include(o => o.LaundryItems)
                .FirstOrDefaultAsync(o => o.Id == id);
                
            if (order == null)
                return null;
                
            return MapOrderToDto(order);
        }
        
        public async Task<IEnumerable<OrderResponseDto>> GetAllOrdersAsync()
        {
            var orders = await _context.Orders
                .Include(o => o.LaundryItems)
                .ToListAsync();
                
            return orders.Select(MapOrderToDto);
        }
        
        public async Task<IEnumerable<OrderResponseDto>> GetUserOrdersAsync(string userId)
        {
            var orders = await _context.Orders
                .Include(o => o.LaundryItems)
                .Where(o => o.UserId == userId)
                .ToListAsync();
                
            return orders.Select(MapOrderToDto);
        }
        
        public async Task<OrderResponseDto> UpdateOrderStatusAsync(int id, OrderUpdateStatusDto updateDto)
        {
            var order = await _context.Orders
                .Include(o => o.LaundryItems)
                .FirstOrDefaultAsync(o => o.Id == id);
                
            if (order == null)
                return null;
                
            order.Status = updateDto.Status;
            if (!string.IsNullOrEmpty(updateDto.Reason))
            {
                order.Reason = updateDto.Reason;
            }
            
            order.UpdatedAt = DateTime.Now;
            
            await _context.SaveChangesAsync();
            
            return MapOrderToDto(order);
        }
        
        public async Task<IEnumerable<OrderResponseDto>> GetPendingOrdersAsync()
        {
            var pendingOrders = await _context.Orders
                .Include(o => o.LaundryItems)
                .Where(o => o.Status == OrderStatus.Pending)
                .ToListAsync();
                
            return pendingOrders.Select(MapOrderToDto);
        }
        
        public async Task<int> GetOrderCountAsync()
        {
            return await _context.Orders.CountAsync();
        }
        
        public async Task<int> GetOrderCountByStatusAsync(OrderStatus status)
        {
            return await _context.Orders.CountAsync(o => o.Status == status);
        }
        
        public async Task<IEnumerable<OrderResponseDto>> GetRecentOrdersAsync(int count)
        {
            var recentOrders = await _context.Orders
                .Include(o => o.LaundryItems)
                .OrderByDescending(o => o.CreatedAt)
                .Take(count)
                .ToListAsync();
                
            return recentOrders.Select(MapOrderToDto);
        }
        
        private OrderResponseDto MapOrderToDto(Order order)
        {
            return new OrderResponseDto
            {
                Id = order.Id,
                OrderDate = order.OrderDate,
                CustomerName = order.CustomerName,
                CustomerSurname = order.CustomerSurname,
                Comment = order.Comment,
                Reason = order.Reason,
                CreatedAt = order.CreatedAt,
                UpdatedAt = order.UpdatedAt,
                Status = order.Status,
                UserId = order.UserId,
                LaundryItems = order.LaundryItems.Select(i => new LaundryItemDto
                {
                    Id = i.Id,
                    Name = i.Name,
                    Price = i.Price,
                    Description = i.Description
                }).ToList()
            };
        }
    }
}
