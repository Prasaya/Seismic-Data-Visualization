# Nginx will start automatically when the container launches
FROM nginx:alpine

WORKDIR /usr/share/nginx/html

# Copy the current directory contents into the container at /usr/share/nginx/html
COPY . .

EXPOSE 80


