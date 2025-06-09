using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace LaundryOrderAPI.Models
{
    public enum OrderStatus
    {
        Pending,
        Approved,
        Rejected,
        Completed
    }

    public class Order
    {        public Order()
        {
            LaundryItems = new List<LaundryItem>();
            CreatedAt = DateTime.UtcNow;
            Status = OrderStatus.Pending;
        }

        public int Id { get; set; }
        
        [Required]
        public DateTime OrderDate { get; set; }
        
        [Required]
        public string CustomerName { get; set; }
        
        [Required]
        public string CustomerSurname { get; set; }
        
        public string Comment { get; set; }
        
        public string Reason { get; set; }
        
        public DateTime CreatedAt { get; set; }
        
        public DateTime? UpdatedAt { get; set; }
        
        public OrderStatus Status { get; set; }
        
        // Navigation property
        public List<LaundryItem> LaundryItems { get; set; }
        
        // User who created the order
        public string UserId { get; set; }
        public AppUser User { get; set; }
    }
}
