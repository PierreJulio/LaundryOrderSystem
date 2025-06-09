FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src
COPY ["LaundryOrderAPI.csproj", "."]
RUN dotnet restore "LaundryOrderAPI.csproj"
COPY . .
WORKDIR "/src"
RUN dotnet build "LaundryOrderAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "LaundryOrderAPI.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENV ASPNETCORE_URLS="http://+:8080"
ENTRYPOINT ["dotnet", "LaundryOrderAPI.dll"]
