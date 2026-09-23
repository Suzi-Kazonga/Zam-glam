"""
Zamglam Courier Service - Flask Microservice
Handles delivery quote calculations based on distance
"""

from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import math

load_dotenv()

app = Flask(__name__)

# Configuration
BASE_DELIVERY_PRICE = 20  # ZMW
PRICE_PER_KM = 5  # ZMW per kilometer


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    Calculate distance between two coordinates using Haversine formula
    Returns distance in kilometers
    """
    R = 6371  # Earth's radius in kilometers
    
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    
    return R * c


@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'Zamglam Courier Service'
    })


@app.route('/api/courier/quote', methods=['POST'])
def get_quote():
    """
    Calculate delivery quote
    Request body: {
        "pickup_lat": float,
        "pickup_lon": float,
        "delivery_lat": float,
        "delivery_lon": float
    }
    """
    try:
        data = request.get_json()
        
        # Validate input
        required_fields = ['pickup_lat', 'pickup_lon', 'delivery_lat', 'delivery_lon']
        if not all(field in data for field in required_fields):
            return jsonify({'error': 'Missing required fields'}), 400
        
        # Calculate distance
        distance = calculate_distance(
            data['pickup_lat'],
            data['pickup_lon'],
            data['delivery_lat'],
            data['delivery_lon']
        )
        
        # Calculate price
        delivery_price = BASE_DELIVERY_PRICE + (distance * PRICE_PER_KM)
        
        return jsonify({
            'distance_km': round(distance, 2),
            'base_price': BASE_DELIVERY_PRICE,
            'distance_price': round(distance * PRICE_PER_KM, 2),
            'total_price': round(delivery_price, 2),
            'currency': 'ZMW'
        })
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/courier/pricing', methods=['GET'])
def get_pricing():
    """Get pricing information"""
    return jsonify({
        'base_price': BASE_DELIVERY_PRICE,
        'price_per_km': PRICE_PER_KM,
        'currency': 'ZMW',
        'formula': f'Total = {BASE_DELIVERY_PRICE} + (distance_km * {PRICE_PER_KM})'
    })


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5001))
    app.run(debug=os.getenv('FLASK_ENV') == 'development', port=port)
