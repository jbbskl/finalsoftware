#!/usr/bin/env python3
"""
Script to improve media tracking in Fanvue bots
Adds used media tracking to mass DM bots and auto-clear functionality
"""

import os
import shutil
from pathlib import Path

def add_media_tracking_to_massdm_bot(bot_path):
    """Add media tracking functionality to mass DM bot"""
    
    bot_file = Path(bot_path) / 'main.py'
    if not bot_file.exists():
        print(f"❌ Bot file not found: {bot_file}")
        return False
    
    # Read the current bot file
    with open(bot_file, 'r') as f:
        content = f.read()
    
    # Add used media tracking configuration
    config_addition = """
    'usedMediaFile': './used_media.json',  # Track used media files
"""
    
    # Find the CONFIG section and add used media file
    if "'usedMediaFile'" not in content:
        # Find the CONFIG dictionary and add the used media file
        config_start = content.find("CONFIG = {")
        if config_start != -1:
            # Find the end of the CONFIG dictionary
            config_end = content.find("}", config_start)
            if config_end != -1:
                # Insert the used media file configuration
                content = content[:config_end] + config_addition + content[config_end:]
    
    # Add media tracking methods
    media_methods = '''
    def load_used_media(self):
        """Load list of used media files"""
        try:
            if not os.path.exists(CONFIG['usedMediaFile']):
                return set()
            
            with open(CONFIG['usedMediaFile'], 'r') as f:
                used_media = json.load(f)
            
            logger.info(f"📄 Loaded {len(used_media)} used media files")
            return set(used_media)
        except Exception as e:
            logger.warning(f"⚠️ Failed to load used media: {e}")
            return set()
    
    def save_used_media(self, used_media):
        """Save list of used media files"""
        try:
            with open(CONFIG['usedMediaFile'], 'w') as f:
                json.dump(list(used_media), f, indent=2)
            logger.info(f"💾 Saved {len(used_media)} used media files")
        except Exception as e:
            logger.error(f"❌ Failed to save used media: {e}")
    
    def clear_used_media_if_needed(self, used_media, total_available):
        """Clear used media if all media has been used"""
        if len(used_media) >= total_available * 0.9:  # If 90% of media is used
            logger.info(f"🔄 Clearing used media list - {len(used_media)}/{total_available} media used")
            used_media.clear()
            self.save_used_media(used_media)
            return True
        return False
    
    def get_media_filename(self, media_item):
        """Extract the filename from a media item"""
        try:
            filename = await media_item.evaluate("""
                () => {
                    const img = this.querySelector('img');
                    if (img) {
                        const src = img.src || img.getAttribute('data-src');
                        if (src) {
                            return src.split('/').pop().split('?')[0];
                        }
                    }
                    return 'unknown_' + Math.random().toString(36).substr(2, 9);
                }
            """)
            return filename
        except Exception as e:
            logger.warning(f"⚠️ Could not extract filename: {e}")
            return f"unknown_{random.randint(1000, 9999)}"
'''
    
    # Find the class definition and add methods
    class_start = content.find("class FanvueMassDMBot:")
    if class_start != -1:
        # Find the end of the class (look for the next class or end of file)
        class_end = content.find("\nclass ", class_start)
        if class_end == -1:
            class_end = len(content)
        
        # Insert the methods before the end of the class
        content = content[:class_end] + media_methods + content[class_end:]
    
    # Update the media selection logic in bundle+text phase
    bundle_selection_old = '''                    # Select random media items
                    import random
                    selected_indices = random.sample(range(len(media_buttons)), num_to_select)'''
    
    bundle_selection_new = '''                    # Load used media and select unused items
                    used_media = self.load_used_media()
                    logger.info(f"📋 Avoiding {len(used_media)} previously used media files")
                    
                    # Clear used media if most media has been used
                    self.clear_used_media_if_needed(used_media, len(media_buttons))
                    
                    # Select random unused media items
                    import random
                    available_indices = []
                    for i in range(len(media_buttons)):
                        try:
                            filename = await self.get_media_filename(media_buttons[i])
                            if filename not in used_media:
                                available_indices.append(i)
                        except:
                            available_indices.append(i)  # Include if filename extraction fails
                    
                    if len(available_indices) < num_to_select:
                        logger.warning(f"⚠️ Only {len(available_indices)} unused media available, selecting from all")
                        available_indices = list(range(len(media_buttons)))
                        used_media.clear()  # Clear used media if not enough unused items
                    
                    selected_indices = random.sample(available_indices, min(num_to_select, len(available_indices)))'''
    
    content = content.replace(bundle_selection_old, bundle_selection_new)
    
    # Update the media selection logic in photo+text phase
    photo_selection_old = '''                    import random
                    selected_index = random.randint(0, len(media_buttons) - 1)
                    selected_button = media_buttons[selected_index]'''
    
    photo_selection_new = '''                    # Load used media and select unused item
                    used_media = self.load_used_media()
                    logger.info(f"📋 Avoiding {len(used_media)} previously used media files")
                    
                    # Clear used media if most media has been used
                    self.clear_used_media_if_needed(used_media, len(media_buttons))
                    
                    # Select random unused media item
                    import random
                    available_indices = []
                    for i in range(len(media_buttons)):
                        try:
                            filename = await self.get_media_filename(media_buttons[i])
                            if filename not in used_media:
                                available_indices.append(i)
                        except:
                            available_indices.append(i)  # Include if filename extraction fails
                    
                    if len(available_indices) == 0:
                        logger.warning("⚠️ No unused media available, selecting from all")
                        available_indices = list(range(len(media_buttons)))
                        used_media.clear()  # Clear used media if no unused items
                    
                    selected_index = random.choice(available_indices)
                    selected_button = media_buttons[selected_index]'''
    
    content = content.replace(photo_selection_old, photo_selection_new)
    
    # Add code to save used media after selection
    save_media_old = '''                        logger.info(f"✅ Step 12: Selected media item {selected_index + 1}/{len(media_buttons)} ({i+1}/{num_to_select})")'''
    
    save_media_new = '''                        logger.info(f"✅ Step 12: Selected media item {selected_index + 1}/{len(media_buttons)} ({i+1}/{num_to_select})")
                        
                        # Add to used media list
                        try:
                            filename = await self.get_media_filename(media_buttons[selected_index])
                            used_media.add(filename)
                        except:
                            pass  # Continue if filename extraction fails'''
    
    content = content.replace(save_media_old, save_media_new)
    
    # Add final save after all selections
    final_save_old = '''                except Exception as e:
                    logger.error(f"❌ Step 12: Could not select media: {e}")
                    return False'''
    
    final_save_new = '''                except Exception as e:
                    logger.error(f"❌ Step 12: Could not select media: {e}")
                    return False
                
                # Save used media list after all selections
                self.save_used_media(used_media)'''
    
    content = content.replace(final_save_old, final_save_new)
    
    # Write the improved bot file
    with open(bot_file, 'w') as f:
        f.write(content)
    
    print(f"✅ Improved media tracking in {bot_file}")
    return True

def main():
    """Improve all mass DM bots"""
    print("🔧 Improving media tracking in Fanvue Mass DM bots...")
    
    bots_to_improve = [
        'fleur_massdm',
        'floortje_massdm'
    ]
    
    for bot in bots_to_improve:
        print(f"\n📁 Improving {bot}...")
        if add_media_tracking_to_massdm_bot(bot):
            print(f"✅ {bot} improved successfully")
        else:
            print(f"❌ Failed to improve {bot}")
    
    print("\n✅ Media tracking improvements complete!")
    print("\n📋 Improvements made:")
    print("1. Added used media tracking to mass DM bots")
    print("2. Added auto-clear functionality when 90% of media is used")
    print("3. Added filename extraction for media items")
    print("4. Added used media list saving after selections")

if __name__ == "__main__":
    main()
