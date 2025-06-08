using System;
using System.ComponentModel.DataAnnotations;

namespace LaundryOrderAPI.Models
{
    public class LaundryItem
    {
        public int Id { get; set; }
        
        [Required]
        public string Name { get; set; }
        
        [Required]
        public decimal Price { get; set; }
        
        public string Description { get; set; }
        
        // Navigation property
        public int OrderId { get; set; }
        public Order Order { get; set; }
    }
}
