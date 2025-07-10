# Этап 1: Сборка Angular приложения (если вы хотите собирать его внутри Docker)
# Если вы уже собрали приложение локально, вы можете пропустить этот этап и перейти сразу к этапу Nginx.
# Мы сделаем это в два этапа для более чистого продакшн образа.
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY . .
RUN npm run build -- --configuration production

# Этап 2: Запуск Nginx для раздачи статических файлов
FROM nginx:stable-alpine

# Удаляем дефолтный конфиг Nginx
RUN rm /etc/nginx/conf.d/default.conf

# Копируем продакшн сборку из этапа build
# ИЗМЕНЕНО: Добавлена подпапка 'browser'
COPY --from=build /app/dist/ibpgatewebsql-v1-0/browser /usr/share/nginx/html

# Копируем наш кастомный конфиг Nginx
COPY nginx.conf /etc/nginx/conf.d/

# Открываем порт 80 для внешних подключений
EXPOSE 80

# Команда, которая запускается при старте контейнера
CMD ["nginx", "-g", "daemon off;"]
