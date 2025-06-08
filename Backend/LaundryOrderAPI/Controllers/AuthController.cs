using LaundryOrderAPI.DTO;
using LaundryOrderAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using System.Threading.Tasks;

namespace LaundryOrderAPI.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;
        
        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }
        
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] UserRegisterDto registerDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var result = await _authService.RegisterAsync(registerDto);
            if (result == null)
                return BadRequest(new { Message = "User already exists or registration failed." });
                
            return Ok(result);
        }
        
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto loginDto)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);
                
            var result = await _authService.LoginAsync(loginDto);
            if (result == null)
                return Unauthorized(new { Message = "Invalid email or password." });
                
            return Ok(result);
        }
    }
}
