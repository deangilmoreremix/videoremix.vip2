#!/usr/bin/env python3
"""
Thumbnail Duplicate Detection System for VideoRemix Dashboard

This script systematically identifies, verifies, and catalogs duplicate thumbnails
using advanced image analysis techniques including perceptual hashing, pixel-level
analysis, and color histogram matching.
"""

import os
import sys
import json
import requests
import hashlib
import imagehash
from PIL import Image, ImageFilter
import numpy as np
from collections import defaultdict
import cv2
from skimage.metrics import structural_similarity as ssim
import pandas as pd
from datetime import datetime
import argparse
from pathlib import Path
import shutil

class ThumbnailDuplicateDetector:
    def __init__(self, output_dir="thumbnail_analysis"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.images_dir = self.output_dir / "images"
        self.images_dir.mkdir(exist_ok=True)
        
        # Analysis data structures
        self.app_data = {}
        self.image_hashes = {}
        self.duplicate_groups = defaultdict(list)
        self.analysis_results = {}
        
    def load_app_data(self, json_file=None):
        """Load app data from JSON file or database"""
        if json_file:
            with open(json_file, 'r') as f:
                self.app_data = json.load(f)
        else:
            # In a real scenario, this would query the database
            # For now, we'll create mock data based on the app URLs
            self.app_data = self._get_mock_app_data()
    
    def _get_mock_app_data(self):
        """Create mock app data based on known app structure"""
        # This would be replaced with actual database query
        apps = {}
        
        # Read app URLs from the generated file
        try:
            with open('app_urls.txt', 'r') as f:
                urls = [line.strip() for line in f if line.strip() and not line.startswith('https://')]
            
            # For each URL, create mock app entries
            app_counter = 1
            for url in urls:
                if url.startswith('https://'):
                    # Extract domain to determine how many apps per hub
                    if 'videoremix.vip' in url:
                        # Multi-app hubs - estimate 5-10 apps per hub
                        num_apps = 8 if 'personalizedcontent' in url else 5
                        for i in range(num_apps):
                            app_id = f"app_{app_counter}"
                            apps[app_id] = {
                                'id': app_id,
                                'name': f'App {app_counter}',
                                'image': f'https://source.unsplash.com/random/400x300?sig={app_counter}',
                                'category': 'AI Tools',
                                'hub_url': url
                            }
                            app_counter += 1
                    else:
                        # Netlify deployments - usually single app
                        app_id = f"app_{app_counter}"
                        apps[app_id] = {
                            'id': app_id,
                            'name': f'App {app_counter}',
                            'image': f'https://source.unsplash.com/random/400x300?sig={app_counter}',
                            'category': 'AI Tools',
                            'hub_url': url
                        }
                        app_counter += 1
                        
        except FileNotFoundError:
            print("app_urls.txt not found. Creating sample data...")
            # Fallback sample data
            for i in range(1, 96):
                apps[f'app_{i}'] = {
                    'id': f'app_{i}',
                    'name': f'App {i}',
                    'image': f'https://source.unsplash.com/random/400x300?sig={i}',
                    'category': 'AI Tools'
                }
        
        return apps
    
    def download_images(self):
        """Download all app thumbnail images"""
        print(f"📥 Downloading {len(self.app_data)} thumbnail images...")
        
        for app_id, app_info in self.app_data.items():
            image_url = app_info.get('image', '')
            if not image_url:
                continue
                
            try:
                response = requests.get(image_url, timeout=10)
                if response.status_code == 200:
                    # Save image
                    ext = '.jpg'  # Default extension
                    if 'png' in image_url.lower():
                        ext = '.png'
                    elif 'gif' in image_url.lower():
                        ext = '.gif'
                        
                    filename = f"{app_id}{ext}"
                    filepath = self.images_dir / filename
                    
                    with open(filepath, 'wb') as f:
                        f.write(response.content)
                    
                    # Update app data with local path
                    app_info['local_image'] = str(filepath)
                    
                else:
                    print(f"❌ Failed to download {app_id}: HTTP {response.status_code}")
                    
            except Exception as e:
                print(f"❌ Error downloading {app_id}: {e}")
    
    def calculate_perceptual_hash(self, image_path):
        """Calculate perceptual hash (dhash, phash, whash)"""
        try:
            img = Image.open(image_path)
            img = img.convert('L').resize((256, 256), Image.LANCZOS)
            
            # Different hash types for comprehensive comparison
            dhash = imagehash.dhash(img, hash_size=16)
            phash = imagehash.phash(img, hash_size=16)
            whash = imagehash.whash(img, hash_size=16)
            
            return {
                'dhash': str(dhash),
                'phash': str(phash), 
                'whash': str(whash)
            }
        except Exception as e:
            print(f"Error calculating perceptual hash for {image_path}: {e}")
            return None
    
    def calculate_color_histogram(self, image_path):
        """Calculate color histogram for image comparison"""
        try:
            img = cv2.imread(str(image_path))
            if img is None:
                return None
                
            # Convert to HSV for better color analysis
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            
            # Calculate histogram
            hist = cv2.calcHist([hsv], [0, 1, 2], None, [8, 8, 8], [0, 180, 0, 256, 0, 256])
            hist = cv2.normalize(hist, hist).flatten()
            
            return hist.tolist()
        except Exception as e:
            print(f"Error calculating histogram for {image_path}: {e}")
            return None
    
    def calculate_pixel_similarity(self, img1_path, img2_path):
        """Calculate pixel-level similarity using SSIM"""
        try:
            img1 = cv2.imread(str(img1_path), cv2.IMREAD_GRAYSCALE)
            img2 = cv2.imread(str(img2_path), cv2.IMREAD_GRAYSCALE)
            
            if img1 is None or img2 is None:
                return 0.0
            
            # Resize to same dimensions for comparison
            height = min(img1.shape[0], img2.shape[0])
            width = min(img1.shape[1], img2.shape[1])
            
            img1_resized = cv2.resize(img1, (width, height))
            img2_resized = cv2.resize(img2, (width, height))
            
            # Calculate SSIM
            score, _ = ssim(img1_resized, img2_resized, full=True)
            return float(score)
            
        except Exception as e:
            print(f"Error calculating pixel similarity: {e}")
            return 0.0
    
    def compare_histograms(self, hist1, hist2):
        """Compare color histograms using correlation"""
        if hist1 is None or hist2 is None:
            return 0.0
            
        try:
            hist1_array = np.array(hist1)
            hist2_array = np.array(hist2)
            
            # Use correlation coefficient
            correlation = cv2.compareHist(hist1_array.astype(np.float32), 
                                        hist2_array.astype(np.float32), 
                                        cv2.HISTCMP_CORREL)
            
            return float(correlation)
        except Exception as e:
            print(f"Error comparing histograms: {e}")
            return 0.0
    
    def analyze_duplicates(self):
        """Main analysis function to identify duplicates"""
        print("🔍 Analyzing images for duplicates...")
        
        # Calculate hashes and histograms for all images
        for app_id, app_info in self.app_data.items():
            local_image = app_info.get('local_image')
            if not local_image or not os.path.exists(local_image):
                continue
                
            # Calculate perceptual hashes
            hashes = self.calculate_perceptual_hash(local_image)
            if hashes:
                self.image_hashes[app_id] = {
                    'hashes': hashes,
                    'histogram': self.calculate_color_histogram(local_image),
                    'app_info': app_info
                }
        
        # Find duplicates using multiple methods
        self._find_exact_duplicates()
        self._find_near_duplicates()
        self._find_similar_images()
        
        # Generate report
        self._generate_report()
    
    def _find_exact_duplicates(self):
        """Find exact duplicate images using hash comparison"""
        print("Finding exact duplicates...")
        
        hash_groups = defaultdict(list)
        
        for app_id, data in self.image_hashes.items():
            # Use phash for exact duplicates
            phash = data['hashes']['phash']
            hash_groups[phash].append(app_id)
        
        # Filter groups with multiple apps
        for phash, app_ids in hash_groups.items():
            if len(app_ids) > 1:
                self.duplicate_groups[f"exact_{phash}"].extend(app_ids)
    
    def _find_near_duplicates(self):
        """Find near-duplicate images using hash hamming distance"""
        print("Finding near-duplicates...")
        
        processed = set()
        
        for app_id1, data1 in self.image_hashes.items():
            if app_id1 in processed:
                continue
                
            near_duplicates = [app_id1]
            
            for app_id2, data2 in self.image_hashes.items():
                if app_id1 == app_id2 or app_id2 in processed:
                    continue
                
                # Compare perceptual hashes
                dhash1 = imagehash.hex_to_hash(data1['hashes']['dhash'])
                dhash2 = imagehash.hex_to_hash(data2['hashes']['dhash'])
                
                # Hamming distance - lower means more similar
                distance = dhash1 - dhash2
                
                if distance <= 5:  # Allow small variations
                    near_duplicates.append(app_id2)
            
            if len(near_duplicates) > 1:
                group_key = f"near_{app_id1}"
                self.duplicate_groups[group_key].extend(near_duplicates)
                processed.update(near_duplicates)
    
    def _find_similar_images(self):
        """Find similar images using histogram and SSIM comparison"""
        print("Finding similar images...")
        
        processed = set()
        
        for app_id1, data1 in self.image_hashes.items():
            if app_id1 in processed:
                continue
                
            similar_images = [app_id1]
            
            for app_id2, data2 in self.image_hashes.items():
                if app_id1 == app_id2 or app_id2 in processed:
                    continue
                
                # Compare histograms
                hist_similarity = self.compare_histograms(
                    data1['histogram'], 
                    data2['histogram']
                )
                
                # Compare SSIM if histograms are similar
                pixel_similarity = 0.0
                if hist_similarity > 0.8:
                    img1_path = data1['app_info']['local_image']
                    img2_path = data2['app_info']['local_image']
                    pixel_similarity = self.calculate_pixel_similarity(img1_path, img2_path)
                
                # Consider similar if histogram > 0.9 or SSIM > 0.85
                if hist_similarity > 0.9 or pixel_similarity > 0.85:
                    similar_images.append(app_id2)
            
            if len(similar_images) > 1:
                group_key = f"similar_{app_id1}"
                self.duplicate_groups[group_key].extend(similar_images)
                processed.update(similar_images)
    
    def _generate_report(self):
        """Generate comprehensive analysis report"""
        print("📊 Generating analysis report...")
        
        # Summary statistics
        total_apps = len(self.app_data)
        total_images_analyzed = len(self.image_hashes)
        total_duplicate_groups = len(self.duplicate_groups)
        total_duplicate_instances = sum(len(group) for group in self.duplicate_groups.values())
        
        # Detailed duplicate analysis
        duplicate_details = []
        for group_key, app_ids in self.duplicate_groups.items():
            group_type = group_key.split('_')[0]
            apps_info = []
            
            for app_id in app_ids:
                app_info = self.app_data.get(app_id, {})
                apps_info.append({
                    'app_id': app_id,
                    'name': app_info.get('name', 'Unknown'),
                    'category': app_info.get('category', 'Unknown'),
                    'hub_url': app_info.get('hub_url', 'N/A')
                })
            
            duplicate_details.append({
                'group_type': group_type,
                'group_key': group_key,
                'apps': apps_info,
                'count': len(app_ids)
            })
        
        # Create report data
        report = {
            'analysis_timestamp': datetime.now().isoformat(),
            'summary': {
                'total_apps': total_apps,
                'images_analyzed': total_images_analyzed,
                'duplicate_groups': total_duplicate_groups,
                'duplicate_instances': total_duplicate_instances,
                'unique_images': total_images_analyzed - total_duplicate_instances + total_duplicate_groups
            },
            'duplicate_analysis': duplicate_details,
            'recommendations': self._generate_recommendations()
        }
        
        # Save JSON report
        report_path = self.output_dir / "duplicate_analysis_report.json"
        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)
        
        # Save CSV summary
        csv_data = []
        for group in duplicate_details:
            for app in group['apps']:
                csv_data.append({
                    'group_type': group['group_type'],
                    'group_key': group['group_key'],
                    'app_id': app['app_id'],
                    'app_name': app['name'],
                    'category': app['category'],
                    'hub_url': app['hub_url']
                })
        
        if csv_data:
            df = pd.DataFrame(csv_data)
            csv_path = self.output_dir / "duplicate_analysis_summary.csv"
            df.to_csv(csv_path, index=False)
        
        # Print summary
        print("\n" + "="*60)
        print("📋 DUPLICATE THUMBNAIL ANALYSIS REPORT")
        print("="*60)
        print(f"Total Apps: {total_apps}")
        print(f"Images Analyzed: {total_images_analyzed}")
        print(f"Duplicate Groups Found: {total_duplicate_groups}")
        print(f"Total Duplicate Instances: {total_duplicate_instances}")
        print(f"Unique Images: {total_images_analyzed - total_duplicate_instances + total_duplicate_groups}")
        print("\nDuplicate Groups:")
        
        for group in duplicate_details:
            print(f"  {group['group_type'].upper()}: {group['count']} apps")
            for app in group['apps'][:3]:  # Show first 3
                print(f"    - {app['name']} ({app['app_id']})")
            if len(group['apps']) > 3:
                print(f"    ... and {len(group['apps']) - 3} more")
        
        print(f"\n📄 Full report saved to: {report_path}")
        if csv_data:
            print(f"📊 CSV summary saved to: {csv_path}")
    
    def _generate_recommendations(self):
        """Generate recommendations for duplicate prevention and replacement"""
        recommendations = []
        
        total_duplicates = sum(len(group) for group in self.duplicate_groups.values())
        
        if total_duplicates > 0:
            recommendations.extend([
                {
                    'priority': 'HIGH',
                    'category': 'Prevention',
                    'action': 'Implement unique image generation prompts',
                    'description': 'Use distinct prompts for each app to ensure unique AI-generated thumbnails'
                },
                {
                    'priority': 'HIGH', 
                    'category': 'Prevention',
                    'action': 'Add duplicate detection to image upload pipeline',
                    'description': 'Check new images against existing thumbnails before approval'
                },
                {
                    'priority': 'MEDIUM',
                    'category': 'Replacement',
                    'action': 'Regenerate duplicate thumbnails with varied prompts',
                    'description': f'Regenerate {total_duplicates} duplicate images using modified prompts'
                },
                {
                    'priority': 'MEDIUM',
                    'category': 'Quality',
                    'action': 'Implement automated quality checks',
                    'description': 'Add blur detection, aspect ratio validation, and content appropriateness checks'
                },
                {
                    'priority': 'LOW',
                    'category': 'Workflow',
                    'action': 'Create thumbnail management dashboard',
                    'description': 'Build admin interface for reviewing, approving, and replacing thumbnails'
                }
            ])
        
        return recommendations

def main():
    parser = argparse.ArgumentParser(description='Analyze thumbnail duplicates in VideoRemix dashboard')
    parser.add_argument('--output-dir', default='thumbnail_analysis', help='Output directory for analysis')
    parser.add_argument('--app-data', help='JSON file with app data (optional)')
    
    args = parser.parse_args()
    
    detector = ThumbnailDuplicateDetector(args.output_dir)
    
    print("🚀 Starting Thumbnail Duplicate Detection Analysis")
    print("="*60)
    
    # Load app data
    detector.load_app_data(args.app_data)
    print(f"✅ Loaded data for {len(detector.app_data)} apps")
    
    # Download images
    detector.download_images()
    print(f"✅ Downloaded images to {detector.images_dir}")
    
    # Analyze duplicates
    detector.analyze_duplicates()
    
    print("\n🎉 Analysis complete!")

if __name__ == "__main__":
    main()
