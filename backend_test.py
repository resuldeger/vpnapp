#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for VPN Application
Tests authentication, proxy servers, and subscription management APIs
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

# Configuration
BASE_URL = "https://proxyhub-mobile.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class VPNBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.headers = HEADERS.copy()
        self.auth_token = None
        self.user_id = None
        self.test_results = []
        
    def log_test(self, test_name: str, success: bool, details: str = "", response_data: Any = None):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "timestamp": datetime.now().isoformat(),
            "response_data": response_data
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {details}")
        
    def make_request(self, method: str, endpoint: str, data: Dict = None, auth_required: bool = False) -> tuple:
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        headers = self.headers.copy()
        
        if auth_required and self.auth_token:
            headers["Authorization"] = f"Bearer {self.auth_token}"
            
        try:
            if method.upper() == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method.upper() == "POST":
                response = requests.post(url, headers=headers, json=data, timeout=30)
            elif method.upper() == "PUT":
                response = requests.put(url, headers=headers, json=data, timeout=30)
            else:
                return False, f"Unsupported method: {method}"
                
            return True, response
        except requests.exceptions.RequestException as e:
            return False, f"Request failed: {str(e)}"
    
    def test_health_check(self):
        """Test basic health check endpoint"""
        success, response = self.make_request("GET", "/health")
        
        if not success:
            self.log_test("Health Check", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "healthy":
                    self.log_test("Health Check", True, "Backend is healthy", data)
                    return True
                else:
                    self.log_test("Health Check", False, f"Unexpected health status: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Health Check", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Health Check", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        # Generate unique email for testing
        test_email = f"testuser_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "SecurePassword123!"
        
        registration_data = {
            "email": test_email,
            "password": test_password
        }
        
        success, response = self.make_request("POST", "/auth/register", registration_data)
        
        if not success:
            self.log_test("User Registration", False, f"Request failed: {response}")
            return False, None, None
            
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ["access_token", "token_type", "user_id", "subscription_tier"]
                
                if all(field in data for field in required_fields):
                    self.auth_token = data["access_token"]
                    self.user_id = data["user_id"]
                    self.log_test("User Registration", True, f"User registered successfully with ID: {self.user_id}", data)
                    return True, test_email, test_password
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("User Registration", False, f"Missing fields in response: {missing_fields}")
                    return False, None, None
            except json.JSONDecodeError:
                self.log_test("User Registration", False, "Invalid JSON response")
                return False, None, None
        else:
            self.log_test("User Registration", False, f"HTTP {response.status_code}: {response.text}")
            return False, None, None
    
    def test_duplicate_registration(self, email: str):
        """Test duplicate email registration should fail"""
        registration_data = {
            "email": email,
            "password": "AnotherPassword123!"
        }
        
        success, response = self.make_request("POST", "/auth/register", registration_data)
        
        if not success:
            self.log_test("Duplicate Registration Prevention", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 400:
            try:
                data = response.json()
                if "already registered" in data.get("detail", "").lower():
                    self.log_test("Duplicate Registration Prevention", True, "Correctly prevented duplicate registration")
                    return True
                else:
                    self.log_test("Duplicate Registration Prevention", False, f"Unexpected error message: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Duplicate Registration Prevention", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Duplicate Registration Prevention", False, f"Expected 400, got {response.status_code}")
            return False
    
    def test_user_login(self, email: str, password: str):
        """Test user login endpoint"""
        login_data = {
            "email": email,
            "password": password
        }
        
        success, response = self.make_request("POST", "/auth/login", login_data)
        
        if not success:
            self.log_test("User Login", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ["access_token", "token_type", "user_id", "subscription_tier"]
                
                if all(field in data for field in required_fields):
                    # Update auth token for subsequent tests
                    self.auth_token = data["access_token"]
                    self.log_test("User Login", True, f"Login successful for user: {data['user_id']}", data)
                    return True
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("User Login", False, f"Missing fields in response: {missing_fields}")
                    return False
            except json.JSONDecodeError:
                self.log_test("User Login", False, "Invalid JSON response")
                return False
        else:
            self.log_test("User Login", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_invalid_login(self):
        """Test login with invalid credentials"""
        login_data = {
            "email": "nonexistent@example.com",
            "password": "wrongpassword"
        }
        
        success, response = self.make_request("POST", "/auth/login", login_data)
        
        if not success:
            self.log_test("Invalid Login Prevention", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 401:
            self.log_test("Invalid Login Prevention", True, "Correctly rejected invalid credentials")
            return True
        else:
            self.log_test("Invalid Login Prevention", False, f"Expected 401, got {response.status_code}")
            return False
    
    def test_user_profile(self):
        """Test authenticated user profile endpoint"""
        if not self.auth_token:
            self.log_test("User Profile", False, "No auth token available")
            return False
            
        success, response = self.make_request("GET", "/auth/profile", auth_required=True)
        
        if not success:
            self.log_test("User Profile", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ["id", "email", "subscription_tier", "created_at"]
                
                if all(field in data for field in required_fields):
                    self.log_test("User Profile", True, f"Profile retrieved for user: {data['email']}", data)
                    return True
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("User Profile", False, f"Missing fields in response: {missing_fields}")
                    return False
            except json.JSONDecodeError:
                self.log_test("User Profile", False, "Invalid JSON response")
                return False
        else:
            self.log_test("User Profile", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_profile_without_auth(self):
        """Test profile endpoint without authentication"""
        success, response = self.make_request("GET", "/auth/profile")
        
        if not success:
            self.log_test("Profile Without Auth", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 403:
            self.log_test("Profile Without Auth", True, "Correctly rejected unauthenticated request")
            return True
        else:
            self.log_test("Profile Without Auth", False, f"Expected 403, got {response.status_code}")
            return False
    
    def test_get_proxies(self):
        """Test get proxies endpoint"""
        if not self.auth_token:
            self.log_test("Get Proxies", False, "No auth token available")
            return False, []
            
        success, response = self.make_request("GET", "/proxies", auth_required=True)
        
        if not success:
            self.log_test("Get Proxies", False, f"Request failed: {response}")
            return False, []
            
        if response.status_code == 200:
            try:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        # Check first proxy structure
                        proxy = data[0]
                        required_fields = ["id", "name", "country", "country_code", "city", "proxy_type", "host", "port", "is_premium", "is_online"]
                        
                        if all(field in proxy for field in required_fields):
                            # Check that free user only sees non-premium proxies
                            premium_proxies = [p for p in data if p.get("is_premium", False)]
                            if len(premium_proxies) == 0:
                                self.log_test("Get Proxies", True, f"Retrieved {len(data)} free proxies correctly", {"proxy_count": len(data)})
                                return True, data
                            else:
                                self.log_test("Get Proxies", False, f"Free user received {len(premium_proxies)} premium proxies")
                                return False, data
                        else:
                            missing_fields = [field for field in required_fields if field not in proxy]
                            self.log_test("Get Proxies", False, f"Missing fields in proxy data: {missing_fields}")
                            return False, data
                    else:
                        self.log_test("Get Proxies", False, "No proxy servers returned")
                        return False, data
                else:
                    self.log_test("Get Proxies", False, f"Expected list, got {type(data)}")
                    return False, []
            except json.JSONDecodeError:
                self.log_test("Get Proxies", False, "Invalid JSON response")
                return False, []
        else:
            self.log_test("Get Proxies", False, f"HTTP {response.status_code}: {response.text}")
            return False, []
    
    def test_get_specific_proxy(self, proxy_id: str):
        """Test get specific proxy endpoint"""
        if not self.auth_token:
            self.log_test("Get Specific Proxy", False, "No auth token available")
            return False
            
        success, response = self.make_request("GET", f"/proxies/{proxy_id}", auth_required=True)
        
        if not success:
            self.log_test("Get Specific Proxy", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                required_fields = ["id", "name", "country", "proxy_type", "host", "port"]
                
                if all(field in data for field in required_fields):
                    if data["id"] == proxy_id:
                        self.log_test("Get Specific Proxy", True, f"Retrieved proxy: {data['name']}", data)
                        return True
                    else:
                        self.log_test("Get Specific Proxy", False, f"ID mismatch: expected {proxy_id}, got {data['id']}")
                        return False
                else:
                    missing_fields = [field for field in required_fields if field not in data]
                    self.log_test("Get Specific Proxy", False, f"Missing fields: {missing_fields}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Get Specific Proxy", False, "Invalid JSON response")
                return False
        elif response.status_code == 404:
            self.log_test("Get Specific Proxy", False, "Proxy not found")
            return False
        else:
            self.log_test("Get Specific Proxy", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_proxies_without_auth(self):
        """Test proxies endpoint without authentication"""
        success, response = self.make_request("GET", "/proxies")
        
        if not success:
            self.log_test("Proxies Without Auth", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 403:
            self.log_test("Proxies Without Auth", True, "Correctly rejected unauthenticated request")
            return True
        else:
            self.log_test("Proxies Without Auth", False, f"Expected 403, got {response.status_code}")
            return False
    
    def test_subscription_upgrade(self):
        """Test subscription upgrade endpoint"""
        if not self.auth_token:
            self.log_test("Subscription Upgrade", False, "No auth token available")
            return False
            
        success, response = self.make_request("POST", "/subscription/upgrade", auth_required=True)
        
        if not success:
            self.log_test("Subscription Upgrade", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if "message" in data and "success" in data["message"].lower():
                    self.log_test("Subscription Upgrade", True, "Subscription upgraded successfully", data)
                    return True
                else:
                    self.log_test("Subscription Upgrade", False, f"Unexpected response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("Subscription Upgrade", False, "Invalid JSON response")
                return False
        else:
            self.log_test("Subscription Upgrade", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def test_revenuecat_webhook(self):
        """Test RevenueCat webhook endpoint"""
        webhook_data = {
            "event_type": "INITIAL_PURCHASE",
            "app_user_id": self.user_id if self.user_id else "test_user",
            "product_id": "premium_monthly"
        }
        
        success, response = self.make_request("POST", "/webhooks/revenuecat", webhook_data)
        
        if not success:
            self.log_test("RevenueCat Webhook", False, f"Request failed: {response}")
            return False
            
        if response.status_code == 200:
            try:
                data = response.json()
                if data.get("status") == "success":
                    self.log_test("RevenueCat Webhook", True, "Webhook processed successfully", data)
                    return True
                else:
                    self.log_test("RevenueCat Webhook", False, f"Unexpected response: {data}")
                    return False
            except json.JSONDecodeError:
                self.log_test("RevenueCat Webhook", False, "Invalid JSON response")
                return False
        else:
            self.log_test("RevenueCat Webhook", False, f"HTTP {response.status_code}: {response.text}")
            return False
    
    def run_all_tests(self):
        """Run all backend tests in sequence"""
        print(f"\n🚀 Starting VPN Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
        # Test 1: Health Check
        health_ok = self.test_health_check()
        
        if not health_ok:
            print("\n❌ Backend health check failed. Stopping tests.")
            return self.generate_summary()
        
        # Test 2: User Registration
        reg_success, test_email, test_password = self.test_user_registration()
        
        if reg_success and test_email and test_password:
            # Test 3: Duplicate Registration Prevention
            self.test_duplicate_registration(test_email)
            
            # Test 4: User Login
            login_success = self.test_user_login(test_email, test_password)
            
            # Test 5: Invalid Login Prevention
            self.test_invalid_login()
            
            if login_success:
                # Test 6: User Profile (Authenticated)
                self.test_user_profile()
                
                # Test 7: Profile Without Auth
                self.test_profile_without_auth()
                
                # Test 8: Get Proxies
                proxies_success, proxies_data = self.test_get_proxies()
                
                # Test 9: Get Specific Proxy
                if proxies_success and proxies_data:
                    first_proxy_id = proxies_data[0]["id"]
                    self.test_get_specific_proxy(first_proxy_id)
                
                # Test 10: Proxies Without Auth
                self.test_proxies_without_auth()
                
                # Test 11: Subscription Upgrade
                self.test_subscription_upgrade()
                
                # Test 12: RevenueCat Webhook
                self.test_revenuecat_webhook()
        
        return self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        total_tests = len(self.test_results)
        passed_tests = len([t for t in self.test_results if t["success"]])
        failed_tests = total_tests - passed_tests
        
        print("\n" + "=" * 60)
        print(f"📊 TEST SUMMARY")
        print("=" * 60)
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Success Rate: {(passed_tests/total_tests*100):.1f}%" if total_tests > 0 else "0%")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for test in self.test_results:
                if not test["success"]:
                    print(f"  • {test['test']}: {test['details']}")
        
        print("\n" + "=" * 60)
        
        return {
            "total": total_tests,
            "passed": passed_tests,
            "failed": failed_tests,
            "success_rate": (passed_tests/total_tests*100) if total_tests > 0 else 0,
            "details": self.test_results
        }

if __name__ == "__main__":
    tester = VPNBackendTester()
    summary = tester.run_all_tests()
    
    # Save detailed results to file
    with open("/app/backend_test_results.json", "w") as f:
        json.dump(summary, f, indent=2, default=str)
    
    print(f"\n📄 Detailed results saved to: /app/backend_test_results.json")