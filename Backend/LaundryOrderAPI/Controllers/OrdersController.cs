using LaundryOrderAPI.DTO;
using LaundryOrderAPI.Models;
using LaundryOrderAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace LaundryOrderAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class OrdersController : ControllerBase
    {
        private readonly IOrderService _orderService;
        
        public OrdersController(IOrderService orderService)
        {
            _orderService = orderService;
        }
        
        [HttpPost]
        public async Task<IActionResult> CreateOrder([FromBody] OrderCreateDto orderDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var result = await _orderService.CreateOrderAsync(orderDto, userId);
            
            return CreatedAtAction(nameof(GetOrderById), new { id = result.Id }, result);
        }
        
        [HttpGet("{id}")]
        public async Task<IActionResult> GetOrderById(int id)
        {
            var order = await _orderService.GetOrderByIdAsync(id);
            if (order == null)
                return NotFound();
                
            // Check if the user is authorized to view this order
            // Regular users can only view their own orders, admins can view all
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (order.UserId != userId && !User.IsInRole("Admin"))
                return Forbid();
                
            return Ok(order);
        }
        
        [HttpGet]
        public async Task<IActionResult> GetOrders()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            
            // Admin can see all orders
            if (User.IsInRole("Admin"))
            {
                var allOrders = await _orderService.GetAllOrdersAsync();
                return Ok(allOrders);
            }
            
            // Regular user can see only their orders
            var userOrders = await _orderService.GetUserOrdersAsync(userId);
            return Ok(userOrders);
        }
        
        [HttpPut("{id}/status")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> UpdateOrderStatus(int id, [FromBody] OrderUpdateStatusDto updateDto)
        {
            if (!ModelState.IsValid)
            {
                // Log les erreurs de validation
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                
                Console.WriteLine($"Validation errors: {String.Join(", ", errors)}");
                return BadRequest(ModelState);
            }
            
            Console.WriteLine($"Received status update request for order {id}: Status={updateDto?.Status}, Reason={updateDto?.Reason}");
                
            if (updateDto == null)
            {
                return BadRequest("UpdateDto cannot be null");
            }
                
            var result = await _orderService.UpdateOrderStatusAsync(id, updateDto);
            if (result == null)
                return NotFound();
                
            return Ok(result);
        }
        
        [HttpGet("pending")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetPendingOrders()
        {
            var pendingOrders = await _orderService.GetPendingOrdersAsync();
            return Ok(pendingOrders);
        }
        
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetOrderStats()
        {
            var stats = new
            {
                Total = await _orderService.GetOrderCountAsync(),
                Pending = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Pending),
                Approved = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Approved),
                Rejected = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Rejected),
                Completed = await _orderService.GetOrderCountByStatusAsync(OrderStatus.Completed),
                RecentOrders = await _orderService.GetRecentOrdersAsync(5)
            };
            
            return Ok(stats);
        }
    }
}
