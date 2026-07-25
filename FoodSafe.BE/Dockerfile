# syntax=docker/dockerfile:1.7
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

COPY FoodSafe.sln common.props ./
COPY src/FoodSafe.Domain.Shared/FoodSafe.Domain.Shared.csproj src/FoodSafe.Domain.Shared/
COPY src/FoodSafe.Domain/FoodSafe.Domain.csproj src/FoodSafe.Domain/
COPY src/FoodSafe.Application.Contracts/FoodSafe.Application.Contracts.csproj src/FoodSafe.Application.Contracts/
COPY src/FoodSafe.Application/FoodSafe.Application.csproj src/FoodSafe.Application/
COPY src/FoodSafe.EntityFrameworkCore/FoodSafe.EntityFrameworkCore.csproj src/FoodSafe.EntityFrameworkCore/
COPY src/FoodSafe.HttpApi/FoodSafe.HttpApi.csproj src/FoodSafe.HttpApi/
COPY src/FoodSafe.HttpApi.Host/FoodSafe.HttpApi.Host.csproj src/FoodSafe.HttpApi.Host/
COPY src/FoodSafe.DbMigrator/FoodSafe.DbMigrator.csproj src/FoodSafe.DbMigrator/

RUN dotnet restore src/FoodSafe.HttpApi.Host/FoodSafe.HttpApi.Host.csproj
RUN dotnet restore src/FoodSafe.DbMigrator/FoodSafe.DbMigrator.csproj

COPY . .
RUN dotnet publish src/FoodSafe.HttpApi.Host/FoodSafe.HttpApi.Host.csproj \
    --configuration Release --no-restore --output /out/api /p:UseAppHost=false
RUN dotnet publish src/FoodSafe.DbMigrator/FoodSafe.DbMigrator.csproj \
    --configuration Release --no-restore --output /out/migrator /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS runtime
WORKDIR /app
RUN apt-get update \
    && apt-get install --yes --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /app/api/Logs /app/migrator/Logs /home/app/.aspnet/DataProtection-Keys \
    && chown -R "$APP_UID":"$APP_UID" /app /home/app
COPY --from=build --chown=$APP_UID:$APP_UID /out/api ./api
COPY --from=build --chown=$APP_UID:$APP_UID /out/migrator ./migrator

USER $APP_UID
EXPOSE 8080
WORKDIR /app/api
ENTRYPOINT ["dotnet", "FoodSafe.HttpApi.Host.dll"]
