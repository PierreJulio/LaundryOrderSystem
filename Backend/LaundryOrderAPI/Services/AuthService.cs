using LaundryOrderAPI.DTO;
using LaundryOrderAPI.Models;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;
using System.Threading.Tasks;

namespace LaundryOrderAPI.Services
{
    public interface IAuthService
    {
        Task<UserResponseDto> RegisterAsync(UserRegisterDto registerDto);
        Task<UserResponseDto> LoginAsync(UserLoginDto loginDto);
    }

    public class TokenResult
    {
        public string Token { get; set; } = string.Empty;
        public DateTime Expiration { get; set; }
    }
    
    public class AuthService : IAuthService
    {
        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly IConfiguration _configuration;
        
        public AuthService(
            UserManager<AppUser> userManager,
            RoleManager<IdentityRole> roleManager,
            IConfiguration configuration)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _configuration = configuration;
        }
        
        public async Task<UserResponseDto> RegisterAsync(UserRegisterDto registerDto)
        {
            var userExists = await _userManager.FindByEmailAsync(registerDto.Email);
            if (userExists != null)
                return null;
                
            var user = new AppUser
            {
                Email = registerDto.Email,
                UserName = registerDto.Email,
                FirstName = registerDto.FirstName,
                LastName = registerDto.LastName,
                PhoneNumber = registerDto.PhoneNumber,
                SecurityStamp = Guid.NewGuid().ToString()
            };
            
            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
                return null;
                
            // Check if "User" role exists, if not create it
            if (!await _roleManager.RoleExistsAsync("User"))
                await _roleManager.CreateAsync(new IdentityRole("User"));
                  // Add the user to "User" role
            await _userManager.AddToRoleAsync(user, "User");
            
            // Create JWT token
            var tokenResult = await GenerateJwtToken(user);
            
            return new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Token = tokenResult.Token,
                Expiration = tokenResult.Expiration.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Roles = (await _userManager.GetRolesAsync(user)).ToList()
            };
        }
        
        public async Task<UserResponseDto> LoginAsync(UserLoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null)
                return null;
                
            var isPasswordValid = await _userManager.CheckPasswordAsync(user, loginDto.Password);
            if (!isPasswordValid)
                return null;
                  // Create JWT token
            var tokenResult = await GenerateJwtToken(user);
            
            return new UserResponseDto
            {
                Id = user.Id,
                Email = user.Email ?? "",
                FirstName = user.FirstName,
                LastName = user.LastName,
                PhoneNumber = user.PhoneNumber,
                Token = tokenResult.Token,
                Expiration = tokenResult.Expiration.ToString("yyyy-MM-ddTHH:mm:ss.fffZ"),
                Roles = (await _userManager.GetRolesAsync(user)).ToList()
            };
        }        private async Task<TokenResult> GenerateJwtToken(AppUser user)
        {
            var userRoles = await _userManager.GetRolesAsync(user);
            
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id),
                new Claim(ClaimTypes.Name, user.UserName ?? ""),
                new Claim(ClaimTypes.Email, user.Email ?? ""),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };
            
            foreach (var role in userRoles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }
            
            // Use the same configuration pattern as Program.cs
            var jwtKey = Environment.GetEnvironmentVariable("JWT_SECRET") ?? 
                         _configuration["Jwt:Key"] ?? 
                         _configuration["JWT:Secret"] ??
                         throw new InvalidOperationException("JWT Key not found");
            
            var jwtIssuer = Environment.GetEnvironmentVariable("JWT_ISSUER") ?? 
                            _configuration["Jwt:Issuer"] ?? 
                            _configuration["JWT:ValidIssuer"] ?? 
                            "LaundryOrderAPI";
            
            var jwtAudience = Environment.GetEnvironmentVariable("JWT_AUDIENCE") ?? 
                              _configuration["Jwt:Audience"] ?? 
                              _configuration["JWT:ValidAudience"] ?? 
                              "LaundryOrderApp";
            
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
            var expiration = DateTime.Now.AddHours(3);
            
            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                expires: expiration,
                claims: claims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
            );
            
            return new TokenResult
            {
                Token = new JwtSecurityTokenHandler().WriteToken(token),
                Expiration = expiration
            };
        }
    }
}
