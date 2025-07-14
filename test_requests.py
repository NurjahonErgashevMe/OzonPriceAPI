#!/usr/bin/env python3

import requests
import json
import time


BASE_URL = "http://localhost:8000"


def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    
    try:
        response = requests.get(f"{BASE_URL}/api/v1/health")
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        print("✓ Health check passed\n")
    except Exception as e:
        print(f"✗ Health check failed: {e}\n")


def test_single_article():
    """Test parsing single article"""
    print("🔍 Testing single article parsing...")
    
    payload = {
        "articles": [1774818716]
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/api/v1/get_price", json=payload)
        end_time = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Time taken: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['success']}")
            print(f"Parsed articles: {data['parsed_articles']}/{data['total_articles']}")
            
            if data['results']:
                result = data['results'][0]
                print(f"Article: {result['article']}")
                print(f"Success: {result['success']}")
                
                if result['price_info']:
                    price_info = result['price_info']
                    print(f"Available: {price_info['isAvailable']}")
                    print(f"Card Price: {price_info['cardPrice']}")
                    print(f"Regular Price: {price_info['price']}")
                    print(f"Original Price: {price_info['originalPrice']}")
                else:
                    print(f"Error: {result['error']}")
        else:
            print(f"Error: {response.text}")
            
        print("✓ Single article test completed\n")
        
    except Exception as e:
        print(f"✗ Single article test failed: {e}\n")


def test_multiple_articles():
    """Test parsing multiple articles"""
    print("🔍 Testing multiple articles parsing...")
    
    payload = {
        "articles": [
            2360879218,859220077,2430448285,2392842054,1774818716,1649767704,2433082108,1372069683,1769433039,1837510918,2384249751,2384245580,2328688150,2328688150,2246018851,2274804444
        ]
    }
    
    try:
        start_time = time.time()
        response = requests.post(f"{BASE_URL}/api/v1/get_price", json=payload)
        end_time = time.time()
        
        print(f"Status: {response.status_code}")
        print(f"Time taken: {end_time - start_time:.2f} seconds")
        
        if response.status_code == 200:
            data = response.json()
            print(f"Success: {data['success']}")
            print(f"Parsed articles: {data['parsed_articles']}/{data['total_articles']}")
            
            for i, result in enumerate(data['results']):
                print(f"  Article {i+1}: {result['article']} - {'✓' if result['success'] else '✗'}")
                if result['price_info']:
                    price_info = result['price_info']
                    print(f"    Card Price: {price_info['cardPrice']}")
                    print(f"    Regular Price: {price_info['price']}")
                elif result['error']:
                    print(f"    Error: {result['error']}")
        else:
            print(f"Error: {response.text}")
            
        print("✓ Multiple articles test completed\n")
        
    except Exception as e:
        print(f"✗ Multiple articles test failed: {e}\n")


def test_invalid_request():
    """Test invalid request handling"""
    print("🔍 Testing invalid request handling...")
    
    # Test empty articles
    payload = {"articles": []}
    
    try:
        response = requests.post(f"{BASE_URL}/api/v1/get_price", json=payload)
        print(f"Empty articles - Status: {response.status_code}")
        
        # Test too many articles
        payload = {"articles": list(range(1, 52))}  # 51 articles
        response = requests.post(f"{BASE_URL}/api/v1/get_price", json=payload)
        print(f"Too many articles - Status: {response.status_code}")
        
        # Test invalid format
        payload = {"articles": ["invalid"]}
        response = requests.post(f"{BASE_URL}/api/v1/get_price", json=payload)
        print(f"Invalid format - Status: {response.status_code}")
        
        print("✓ Invalid request tests completed\n")
        
    except Exception as e:
        print(f"✗ Invalid request test failed: {e}\n")


def test_restart_parser():
    """Test parser restart"""
    print("🔍 Testing parser restart...")
    
    try:
        response = requests.post(f"{BASE_URL}/api/v1/restart_parser")
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            print(f"Response: {response.json()}")
            print("✓ Parser restart test completed\n")
        else:
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"✗ Parser restart test failed: {e}\n")


def main():
    """Run all tests"""
    print("🚀 Starting API tests...\n")
    
    test_health()
    test_single_article()
    test_multiple_articles()
    test_invalid_request()
    test_restart_parser()
    
    print("🎉 All tests completed!")


if __name__ == "__main__":
    main()