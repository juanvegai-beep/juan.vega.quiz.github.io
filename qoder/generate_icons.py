from PIL import Image, ImageDraw, ImageFont
import os

def create_icon(size, filename):
    # Crear imagen con fondo degradado
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)
    
    # Dibujar fondo degradado simple
    for y in range(size):
        r = int(102 + (118 - 102) * y / size)
        g = int(126 + (75 - 126) * y / size)
        b = int(234 + (162 - 234) * y / size)
        color = (r, g, b)
        draw.line([(0, y), (size, y)], fill=color)
    
    # Dibujar texto "M"
    try:
        font_size = int(size * 0.6)
        # Intentar usar una fuente del sistema
        try:
            font = ImageFont.truetype("arial.ttf", font_size)
        except:
            font = ImageFont.truetype("C:\\Windows\\Fonts\\arial.ttf", font_size)
    except:
        # Si no hay fuente disponible, usar la predeterminada
        font = ImageFont.load_default()
    
    # Calcular posición del texto
    text = "M"
    bbox = draw.textbbox((0, 0), text, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) // 2
    y = (size - text_height) // 2
    
    # Dibujar borde del texto
    border_color = '#FF6B6B'
    border_width = max(2, size // 50)
    for adj in range(-border_width, border_width+1):
        for adj2 in range(-border_width, border_width+1):
            draw.text((x+adj, y+adj2), text, font=font, fill=border_color)
    
    # Dibujar texto principal
    draw.text((x, y), text, font=font, fill='#FFD700')
    
    # Guardar imagen
    img.save(filename)
    print(f"✓ Icono creado: {filename}")

# Crear directorio si no existe
os.makedirs('icons', exist_ok=True)

# Crear iconos
create_icon(192, 'icon-192.png')
create_icon(512, 'icon-512.png')

print("\n✅ ¡Iconos creados exitosamente!")
print("Los iconos están listos para usar en tu PWA.")
