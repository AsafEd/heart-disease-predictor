#!/usr/bin/env python3
"""
Test script for the Heart Disease Risk Prediction API.

Run this script to verify the API is working correctly.
Make sure the backend server is running on http://localhost:8000 first.
"""

import json
import requests

BASE_URL = "http://localhost:8000"


def test_health():
    """Test the health check endpoint."""
    print("\n1. Testing /api/health...")
    try:
        response = requests.get(f"{BASE_URL}/api/health")
        response.raise_for_status()
        data = response.json()
        print(f"   Status: {data['status']}")
        print(f"   Model trained: {data['model_trained']}")
        print(f"   Database connected: {data['database_connected']}")
        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        return False


def test_metrics():
    """Test the metrics endpoint."""
    print("\n2. Testing /api/metrics...")
    try:
        response = requests.get(f"{BASE_URL}/api/metrics")
        response.raise_for_status()
        data = response.json()
        print(f"   Accuracy:  {data['accuracy']:.2%}")
        print(f"   Precision: {data['precision']:.2%}")
        print(f"   Recall:    {data['recall']:.2%}")
        print(f"   F1 Score:  {data['f1']:.2%}")
        print(f"   Test size: {data['test_size']} samples")
        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        return False


def test_distributions():
    """Test the distributions endpoint."""
    print("\n3. Testing /api/distributions...")
    try:
        response = requests.get(f"{BASE_URL}/api/distributions")
        response.raise_for_status()
        data = response.json()
        print(f"   Available features: {list(data.keys())}")
        for feature, dist in data.items():
            print(f"   - {feature}: mean={dist['mean']:.1f}, std={dist['std']:.1f}")
        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        return False


def test_predict_lower_risk():
    """Test prediction with lower-risk patient data."""
    print("\n4. Testing /api/predict (lower-risk patient)...")
    try:
        payload = {
            "age": 45,
            "sex": 0,  # Female
            "cp": 0,   # Typical angina
            "trtbps": 120,
            "chol": 200,
            "fbs": 0,
            "restecg": 0,
            "thalachh": 160,
            "exng": 0,
            "ca": 0,
            "note": "Test - lower risk patient"
        }
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        data = response.json()
        print(f"   Predicted label: {data['predicted_label']}")
        print(f"   Probability: {data['predicted_probability']:.2%}")
        print(f"   Submission ID: {data['submission_id']}")
        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        return False


def test_predict_higher_risk():
    """Test prediction with higher-risk patient data."""
    print("\n5. Testing /api/predict (higher-risk patient)...")
    try:
        payload = {
            "age": 62,
            "sex": 1,  # Male
            "cp": 3,   # Asymptomatic
            "trtbps": 160,
            "chol": 300,
            "fbs": 1,
            "restecg": 2,
            "thalachh": 100,
            "exng": 1,
            "ca": 2,
            "note": "Test - higher risk patient"
        }
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        response.raise_for_status()
        data = response.json()
        print(f"   Predicted label: {data['predicted_label']}")
        print(f"   Probability: {data['predicted_probability']:.2%}")
        print(f"   Submission ID: {data['submission_id']}")
        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        if hasattr(e, 'response') and e.response is not None:
            print(f"   Response: {e.response.text}")
        return False


def test_submissions():
    """Test the submissions list endpoint."""
    print("\n6. Testing /api/submissions...")
    try:
        response = requests.get(f"{BASE_URL}/api/submissions?page=1&per_page=5")
        response.raise_for_status()
        data = response.json()
        print(f"   Total submissions: {data['total']}")
        print(f"   Page: {data['page']} of {data['total_pages']}")
        if data['submissions']:
            print(f"   Latest submission:")
            latest = data['submissions'][0]
            print(f"     - ID: {latest['id']}")
            print(f"     - Created: {latest['created_at']}")
            print(f"     - Probability: {latest['predicted_probability']:.2%}")
        return True
    except Exception as e:
        print(f"   ERROR: {e}")
        return False


def test_validation():
    """Test input validation."""
    print("\n7. Testing input validation...")
    try:
        # Invalid age (out of range)
        payload = {
            "age": 150,  # Invalid: > 120
            "sex": 0,
            "cp": 0,
            "trtbps": 120,
            "chol": 200,
            "fbs": 0,
            "restecg": 0,
            "thalachh": 160,
            "exng": 0,
            "ca": 0
        }
        response = requests.post(
            f"{BASE_URL}/api/predict",
            json=payload,
            headers={"Content-Type": "application/json"}
        )
        if response.status_code == 422:
            print("   Validation correctly rejected invalid age (150)")
            return True
        else:
            print(f"   WARNING: Expected 422, got {response.status_code}")
            return False
    except Exception as e:
        print(f"   ERROR: {e}")
        return False


def main():
    """Run all tests."""
    print("=" * 60)
    print("Heart Disease Risk Prediction API - Test Suite")
    print("=" * 60)
    print(f"\nBase URL: {BASE_URL}")

    results = []
    results.append(("Health Check", test_health()))
    results.append(("Model Metrics", test_metrics()))
    results.append(("Distributions", test_distributions()))
    results.append(("Predict (Lower Risk)", test_predict_lower_risk()))
    results.append(("Predict (Higher Risk)", test_predict_higher_risk()))
    results.append(("List Submissions", test_submissions()))
    results.append(("Input Validation", test_validation()))

    # Summary
    print("\n" + "=" * 60)
    print("TEST SUMMARY")
    print("=" * 60)
    passed = sum(1 for _, result in results if result)
    total = len(results)

    for name, result in results:
        status = "PASS" if result else "FAIL"
        print(f"  {status}: {name}")

    print(f"\nTotal: {passed}/{total} tests passed")

    if passed == total:
        print("\nAll tests passed! The API is working correctly.")
    else:
        print("\nSome tests failed. Please check the backend server.")

    return passed == total


if __name__ == "__main__":
    import sys
    success = main()
    sys.exit(0 if success else 1)
