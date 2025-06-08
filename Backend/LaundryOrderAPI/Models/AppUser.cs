using Microsoft.AspNetCore.Identity;
using System.Collections.Generic;

namespace LaundryOrderAPI.Models
{
    public class AppUser : IdentityUser
    {
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        
        // Navigation property
        public List<Order> Orders { get; set; } = new List<Order>();
    }
}
