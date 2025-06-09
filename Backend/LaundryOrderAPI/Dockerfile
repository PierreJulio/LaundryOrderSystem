# Dockerfile pour LaundryOrderAPI
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copier le fichier csproj et restaurer les dépendances
COPY ["LaundryOrderAPI.csproj", "."]
RUN dotnet restore "LaundryOrderAPI.csproj"

# Copier tout le code source
COPY . .
WORKDIR "/src"
RUN dotnet build "LaundryOrderAPI.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "LaundryOrderAPI.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .

# Créer un utilisateur non-root pour la sécurité
RUN adduser --disabled-password --gecos '' appuser && chown -R appuser /app
USER appuser

ENTRYPOINT ["dotnet", "LaundryOrderAPI.dll"]
