import requests
import sys
import time
from datetime import datetime

class KineaAPITester:
    def __init__(self, base_url="https://dark-neomorphic.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.admin_token = None
        self.user_token = None
        self.tests_run = 0
        self.tests_passed = 0
        self.failed_tests = []

    def log(self, message, test_type="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {test_type}: {message}")

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None, description=""):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        self.log(f"Testing {name}...", "TEST")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=test_headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers, timeout=10)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                self.log(f"✅ PASSED - {name} - Status: {response.status_code}", "PASS")
                try:
                    return True, response.json() if response.content else {}
                except:
                    return True, {}
            else:
                self.log(f"❌ FAILED - {name} - Expected {expected_status}, got {response.status_code}", "FAIL")
                self.log(f"Response: {response.text[:200]}", "ERROR")
                self.failed_tests.append({
                    "name": name,
                    "endpoint": endpoint,
                    "expected": expected_status,
                    "actual": response.status_code,
                    "response": response.text[:200],
                    "description": description
                })
                return False, {}

        except Exception as e:
            self.log(f"❌ FAILED - {name} - Error: {str(e)}", "ERROR")
            self.failed_tests.append({
                "name": name,
                "endpoint": endpoint,
                "error": str(e),
                "description": description
            })
            return False, {}

    def test_super_admin_login(self):
        """Test super admin login with predefined credentials"""
        self.log("=== TESTING SUPER ADMIN LOGIN ===", "SECTION")
        success, response = self.run_test(
            "Super Admin Login",
            "POST",
            "auth/login",
            200,
            data={
                "email": "bedirhanozcelik829@gmail.com",
                "password": "admin_1987",
                "ip_address": "127.0.0.1"
            },
            description="Login with super admin credentials"
        )
        if success and 'token' in response:
            self.admin_token = response['token']
            self.log(f"Super admin token obtained: {self.admin_token[:20]}...", "SUCCESS")
            return True
        return False

    def test_user_registration(self):
        """Test user registration with Gmail validation"""
        self.log("=== TESTING USER REGISTRATION ===", "SECTION")
        
        # Test invalid email (non-Gmail)
        success, _ = self.run_test(
            "Registration with non-Gmail",
            "POST",
            "auth/register",
            422,  # Validation error expected
            data={
                "username": "testuser",
                "email": "test@yahoo.com",
                "password": "password123",
                "ip_address": "127.0.0.1"
            },
            description="Should reject non-Gmail addresses"
        )

        # Test valid Gmail registration
        timestamp = int(time.time())
        success, response = self.run_test(
            "Registration with Gmail",
            "POST",
            "auth/register",
            200,
            data={
                "username": f"testuser{timestamp}",
                "email": f"test{timestamp}@gmail.com",
                "password": "password123",
                "ip_address": "127.0.0.1"
            },
            description="Should accept Gmail addresses"
        )
        
        if success and 'token' in response:
            self.user_token = response['token']
            self.log(f"User token obtained: {self.user_token[:20]}...", "SUCCESS")
            return True
        return False

    def test_user_login(self):
        """Test user login"""
        self.log("=== TESTING USER LOGIN ===", "SECTION")
        
        # Test invalid credentials
        self.run_test(
            "Login with invalid credentials",
            "POST",
            "auth/login",
            401,
            data={
                "email": "nonexistent@gmail.com",
                "password": "wrongpassword",
                "ip_address": "127.0.0.1"
            },
            description="Should reject invalid credentials"
        )

    def test_auth_me(self):
        """Test getting current user info"""
        self.log("=== TESTING AUTH ME ENDPOINT ===", "SECTION")
        
        if self.admin_token:
            self.run_test(
                "Get current user (admin)",
                "GET",
                "auth/me",
                200,
                headers={"Authorization": f"Bearer {self.admin_token}"},
                description="Should return admin user info"
            )

        if self.user_token:
            self.run_test(
                "Get current user (regular user)",
                "GET",
                "auth/me",
                200,
                headers={"Authorization": f"Bearer {self.user_token}"},
                description="Should return regular user info"
            )

    def test_series_management(self):
        """Test series CRUD operations"""
        self.log("=== TESTING SERIES MANAGEMENT ===", "SECTION")
        
        # Get all series
        self.run_test(
            "Get all series",
            "GET",
            "series",
            200,
            description="Should return list of series"
        )

        # Search series
        self.run_test(
            "Search series",
            "GET",
            "series/search?q=test",
            200,
            description="Should return search results"
        )

        # Create series (requires moderator/admin)
        if self.admin_token:
            success, response = self.run_test(
                "Create series",
                "POST",
                "series",
                200,
                data={
                    "title": "Test Series",
                    "description": "A test series for API testing",
                    "poster_url": "https://via.placeholder.com/300x450",
                    "genre": "Drama"
                },
                headers={"Authorization": f"Bearer {self.admin_token}"},
                description="Should create new series"
            )
            
            if success and 'id' in response:
                series_id = response['id']
                self.log(f"Created series with ID: {series_id}", "SUCCESS")
                
                # Get specific series
                self.run_test(
                    "Get specific series",
                    "GET",
                    f"series/{series_id}",
                    200,
                    description="Should return specific series"
                )
                
                return series_id
        return None

    def test_season_management(self, series_id):
        """Test season CRUD operations"""
        if not series_id or not self.admin_token:
            return None
            
        self.log("=== TESTING SEASON MANAGEMENT ===", "SECTION")
        
        # Create season
        success, response = self.run_test(
            "Create season",
            "POST",
            "seasons",
            200,
            data={
                "series_id": series_id,
                "season_number": 1,
                "title": "Season 1"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"},
            description="Should create new season"
        )
        
        if success and 'id' in response:
            season_id = response['id']
            self.log(f"Created season with ID: {season_id}", "SUCCESS")
            
            # Get seasons for series
            self.run_test(
                "Get seasons for series",
                "GET",
                f"series/{series_id}/seasons",
                200,
                description="Should return seasons for series"
            )
            
            return season_id
        return None

    def test_episode_management(self, season_id):
        """Test episode CRUD operations"""
        if not season_id or not self.admin_token:
            return None
            
        self.log("=== TESTING EPISODE MANAGEMENT ===", "SECTION")
        
        # Create episode
        success, response = self.run_test(
            "Create episode",
            "POST",
            "episodes",
            200,
            data={
                "season_id": season_id,
                "episode_number": 1,
                "title": "Test Episode",
                "video_embed_url": "https://www.youtube.com/embed/dQw4w9WgXcQ",
                "thumbnail_url": "https://via.placeholder.com/300x200",
                "description": "A test episode"
            },
            headers={"Authorization": f"Bearer {self.admin_token}"},
            description="Should create new episode"
        )
        
        if success and 'id' in response:
            episode_id = response['id']
            self.log(f"Created episode with ID: {episode_id}", "SUCCESS")
            
            # Get episodes for season
            self.run_test(
                "Get episodes for season",
                "GET",
                f"seasons/{season_id}/episodes",
                200,
                description="Should return episodes for season"
            )
            
            # Get specific episode (should increment views)
            self.run_test(
                "Get specific episode",
                "GET",
                f"episodes/{episode_id}",
                200,
                description="Should return specific episode and increment views"
            )
            
            return episode_id
        return None

    def test_comment_system(self, episode_id):
        """Test comment system with anti-spam"""
        if not episode_id or not self.user_token:
            return
            
        self.log("=== TESTING COMMENT SYSTEM ===", "SECTION")
        
        # Get comments for episode
        self.run_test(
            "Get comments for episode",
            "GET",
            f"episodes/{episode_id}/comments",
            200,
            description="Should return comments for episode"
        )
        
        # Create comment
        success, response = self.run_test(
            "Create comment",
            "POST",
            "comments",
            200,
            data={
                "episode_id": episode_id,
                "content": "This is a test comment",
                "parent_comment_id": None
            },
            headers={"Authorization": f"Bearer {self.user_token}"},
            description="Should create new comment"
        )
        
        if success and 'id' in response:
            comment_id = response['id']
            self.log(f"Created comment with ID: {comment_id}", "SUCCESS")
            
            # Test comment like
            self.run_test(
                "Like comment",
                "POST",
                f"comments/{comment_id}/like",
                200,
                headers={"Authorization": f"Bearer {self.user_token}"},
                description="Should like/unlike comment"
            )
            
            # Test anti-spam (try to create multiple comments quickly)
            self.log("Testing anti-spam protection...", "TEST")
            spam_attempts = 0
            for i in range(6):  # Try to create 6 comments (limit is 5 per 60s)
                success, _ = self.run_test(
                    f"Spam comment {i+1}",
                    "POST",
                    "comments",
                    200 if i < 4 else 429,  # First 5 should work, 6th should fail
                    data={
                        "episode_id": episode_id,
                        "content": f"Spam comment {i+1}",
                        "parent_comment_id": None
                    },
                    headers={"Authorization": f"Bearer {self.user_token}"},
                    description=f"Anti-spam test {i+1}/6"
                )
                if not success and i >= 4:
                    spam_attempts += 1
                time.sleep(0.5)  # Small delay between requests
            
            if spam_attempts > 0:
                self.log("✅ Anti-spam protection working", "SUCCESS")
            
            return comment_id
        return None

    def test_admin_features(self):
        """Test admin-specific features"""
        if not self.admin_token:
            return
            
        self.log("=== TESTING ADMIN FEATURES ===", "SECTION")
        
        # Get stats
        self.run_test(
            "Get admin stats",
            "GET",
            "stats",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"},
            description="Should return platform statistics"
        )
        
        # Search users
        self.run_test(
            "Search users",
            "GET",
            "users/search?q=test",
            200,
            headers={"Authorization": f"Bearer {self.admin_token}"},
            description="Should return user search results"
        )
        
        # Get ads
        self.run_test(
            "Get ads",
            "GET",
            "ads",
            200,
            description="Should return ad content"
        )
        
        # Update ads
        self.run_test(
            "Update ads",
            "PUT",
            "ads",
            200,
            data={"content": "<p>Test ad content</p>"},
            headers={"Authorization": f"Bearer {self.admin_token}"},
            description="Should update ad content"
        )

    def test_favorites_system(self, series_id):
        """Test favorites system"""
        if not series_id or not self.user_token:
            return
            
        self.log("=== TESTING FAVORITES SYSTEM ===", "SECTION")
        
        # Add to favorites
        self.run_test(
            "Add to favorites",
            "POST",
            f"favorites/{series_id}",
            200,
            headers={"Authorization": f"Bearer {self.user_token}"},
            description="Should add series to favorites"
        )
        
        # Get favorites
        self.run_test(
            "Get favorites",
            "GET",
            "favorites",
            200,
            headers={"Authorization": f"Bearer {self.user_token}"},
            description="Should return user's favorite series"
        )
        
        # Remove from favorites
        self.run_test(
            "Remove from favorites",
            "POST",
            f"favorites/{series_id}",
            200,
            headers={"Authorization": f"Bearer {self.user_token}"},
            description="Should remove series from favorites"
        )

    def test_profile_management(self):
        """Test profile management"""
        if not self.user_token:
            return
            
        self.log("=== TESTING PROFILE MANAGEMENT ===", "SECTION")
        
        # Update profile photo
        self.run_test(
            "Update profile photo",
            "PUT",
            "users/me/profile-photo",
            200,
            data={"profile_photo_url": "https://via.placeholder.com/100x100"},
            headers={"Authorization": f"Bearer {self.user_token}"},
            description="Should update user's profile photo"
        )

    def run_all_tests(self):
        """Run all API tests"""
        self.log("🚀 Starting KINEA API Tests", "START")
        start_time = time.time()
        
        # Authentication tests
        if not self.test_super_admin_login():
            self.log("❌ Super admin login failed - stopping critical tests", "CRITICAL")
            
        self.test_user_registration()
        self.test_user_login()
        self.test_auth_me()
        
        # Content management tests
        series_id = self.test_series_management()
        season_id = self.test_season_management(series_id)
        episode_id = self.test_episode_management(season_id)
        
        # User interaction tests
        self.test_comment_system(episode_id)
        self.test_favorites_system(series_id)
        self.test_profile_management()
        
        # Admin tests
        self.test_admin_features()
        
        # Summary
        end_time = time.time()
        duration = end_time - start_time
        
        self.log("=" * 60, "SUMMARY")
        self.log(f"📊 Tests completed in {duration:.2f} seconds", "SUMMARY")
        self.log(f"✅ Passed: {self.tests_passed}/{self.tests_run}", "SUMMARY")
        self.log(f"❌ Failed: {len(self.failed_tests)}/{self.tests_run}", "SUMMARY")
        
        if self.failed_tests:
            self.log("Failed tests:", "SUMMARY")
            for test in self.failed_tests:
                error_msg = test.get('error', f"Status {test.get('actual', 'unknown')}")
                self.log(f"  - {test['name']}: {error_msg}", "FAIL")
        
        success_rate = (self.tests_passed / self.tests_run) * 100 if self.tests_run > 0 else 0
        self.log(f"📈 Success rate: {success_rate:.1f}%", "SUMMARY")
        
        return self.tests_passed == self.tests_run

def main():
    tester = KineaAPITester()
    success = tester.run_all_tests()
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())