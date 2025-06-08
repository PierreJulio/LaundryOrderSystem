using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using LaundryOrderAPI.Models;

namespace LaundryOrderAPI.DTO
{
    public class LaundryItemDto
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        [Required]
        public decimal Price { get; set; }
        
        public string Description { get; set; }
    }
    
    public class OrderCreateDto
    {
        [Required]
        public DateTime OrderDate { get; set; }
        
        [Required]
        public string CustomerName { get; set; }
        
        [Required]
        public string CustomerSurname { get; set; }
        
        public string Comment { get; set; }
        
        public string Reason { get; set; }
        
        [Required]
        public List<LaundryItemDto> LaundryItems { get; set; }
    }
    
    public class OrderResponseDto
    {
        public int Id { get; set; }
        public DateTime OrderDate { get; set; }
        public string CustomerName { get; set; }
        public string CustomerSurname { get; set; }
        public string Comment { get; set; }
        public string Reason { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public OrderStatus Status { get; set; }
        public List<LaundryItemDto> LaundryItems { get; set; }
        public string UserId { get; set; }
    }
    
    public class OrderUpdateStatusDto
    {
        [Required]
        public OrderStatus Status { get; set; }
        
        public string Reason { get; set; }
    }
}
