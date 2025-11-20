# Facebook Business Verification Guide for Meedi8

## Overview

Facebook requires Business Verification to access user data through their APIs. This guide provides step-by-step instructions for Chris to complete the verification process.

**Timeline:** 2-7 business days after submission

**Status:** Setup complete, verification pending

---

## What You Have Already

✅ **Facebook App Created:** Meedi8_LOGIN  
✅ **App ID:** 2024140928418143  
✅ **App Secret:** 83cb50b512ff5d0c6ee0a522b45245bf  
✅ **Use Case:** Authenticate and request data from users with Facebook Login  
✅ **Basic Settings:** Configured (app icon, privacy policy, category)  
✅ **OAuth Redirect URIs:** Configured  

---

## What's Needed: Business Verification Documents

Facebook requires proof that Meedi8 is a legitimate registered business.

### Required Documents:

1. **Company Registration Certificate**
   - Certificate of Incorporation for Meedi8 Ltd
   - Must show company name, registration number, date
   - PDF or image format

2. **Proof of Business Address**
   - One of:
     - Utility bill (electricity, water, gas)
     - Bank statement
     - Tax document
     - Government-issued business license
   - Must show:
     - Business name: Meedi8 Ltd
     - Business address matching registration
     - Date within last 3 months

3. **Business Tax ID / Company Number**
   - UK Company Number (from Companies House)
   - Or VAT registration number if applicable

4. **Business Phone Number**
   - Must be business line (not personal)
   - Must be able to receive verification call/SMS
   - UK number recommended: +44 XXXX XXXXXX

5. **Business Email**
   - Professional domain email: contact@meedi8.com or admin@meedi8.com
   - Not personal gmail/yahoo

6. **Business Website**
   - Already provided: https://meedi8.com
   - Must be live and functional
   - Must have Privacy Policy and Terms of Service pages

---

## Step-by-Step Verification Process

### Step 1: Gather All Documents

**Checklist:**
- [ ] Certificate of Incorporation (PDF)
- [ ] Proof of address (utility bill/bank statement - last 3 months)
- [ ] Company number from Companies House
- [ ] Business phone number ready
- [ ] Business email confirmed working
- [ ] Website live with privacy policy

---

### Step 2: Access Business Verification in Facebook

1. **Go to Facebook Developers:** https://developers.facebook.com/
2. **Select App:** Meedi8_LOGIN
3. **Left Sidebar:** Click **"Required actions"** or **"Dashboard"**
4. **Find:** "Business verification" section
5. **Click:** "Start Verification" or "Verify Now"

---

### Step 3: Choose Verification Method

Facebook offers two methods:

#### **Method A: Automatic Verification (Fastest)**
- Facebook checks public business records
- Only works if business is in their database
- Takes 1-2 days

**Steps:**
1. Enter Company Number from Companies House
2. Confirm business details match
3. Submit
4. Wait for automated check

#### **Method B: Manual Document Upload (Most Common)**
- Upload documents for human review
- Takes 3-7 days
- More reliable for new businesses

**Steps:**
1. Select "Upload documents"
2. Upload each required document
3. Facebook reviews manually
4. May request additional info

---

### Step 4: Fill Out Business Information Form

**You'll need to provide:**

**1. Legal Business Name**
```
Meedi8 Ltd
```

**2. Business Registration Number**
```
[Your UK Company Number from Companies House]
Example: 12345678
```

**3. Business Address**
```
[Your registered business address]
Street Address
City
Postal Code
United Kingdom
```

**4. Business Phone Number**
```
+44 [Your business phone]
```

**5. Business Email**
```
contact@meedi8.com
[or whatever business email you use]
```

**6. Business Website**
```
https://meedi8.com
```

**7. Industry/Category**
```
Social Networking / Health & Wellness / Technology
```

**8. Description of Business**
```
Meedi8 is an AI-powered mediation platform that helps couples and families 
resolve conflicts through guided conversations. We use Facebook Login to 
authenticate users securely and provide personalized conflict resolution support.
```

---

### Step 5: Upload Required Documents

**Document Upload Tips:**

1. **File Format:**
   - PDF preferred
   - Or clear photos (JPG/PNG)
   - Max 5MB per file

2. **Image Quality:**
   - All text must be readable
   - No blurry photos
   - No cut-off edges
   - Color scan/photo preferred

3. **Document Requirements:**
   - Recent (within 3 months for proof of address)
   - Official (no handwritten documents)
   - Complete (don't crop out important info)

**What to Upload:**

**Upload 1: Company Registration Certificate**
- File name: `Meedi8_Certificate_of_Incorporation.pdf`
- Shows: Legal name, company number, incorporation date

**Upload 2: Proof of Business Address**
- File name: `Meedi8_Proof_of_Address.pdf`
- Utility bill, bank statement, or tax document
- Must match registered address
- Must be within last 3 months

**Upload 3: Additional Verification (if requested)**
- May ask for ID of business owner
- May ask for tax documents
- May ask for business license

---

### Step 6: Phone Verification

After document submission, Facebook may call to verify:

**What Happens:**
1. Automated or live call to business phone
2. They may ask to confirm business details
3. Or provide verification code

**Be Ready To:**
- Answer business phone number provided
- Confirm business name and address
- Provide verification code if given
- Have documents handy for reference

---

### Step 7: Wait for Review

**Timeline:**
- **Automatic verification:** 1-2 business days
- **Manual review:** 3-7 business days
- **If more info needed:** Facebook emails you

**Check Status:**
1. Go to Facebook Developers dashboard
2. Look for "Business verification" status
3. Will show: "Pending", "Verified", or "More info needed"

---

### Step 8: If Verification Fails

**Common Reasons:**

1. **Documents don't match**
   - Solution: Ensure name on all documents is exactly "Meedi8 Ltd"
   - Check address matches exactly

2. **Documents too old**
   - Solution: Provide recent utility bill (last 3 months)

3. **Can't verify business**
   - Solution: Provide additional documents (tax return, business license)

4. **Website not compliant**
   - Solution: Ensure privacy policy is clear and accessible
   - Add Terms of Service page
   - Make sure site is fully functional

**If Rejected:**
1. Read rejection reason carefully
2. Fix the issue mentioned
3. Re-submit with corrected documents
4. Can appeal if you believe it's an error

---

## After Verification Approved

### What Changes:

✅ **App Status:** Changes from "Development" to "Live"  
✅ **User Access:** Any Facebook user can now use your login  
✅ **API Limits:** Higher rate limits  
✅ **Permissions:** Can request advanced permissions (if needed later)  

### What to Do Next:

1. **Test OAuth Login:**
   - Test with multiple Facebook accounts
   - Ensure login flow works smoothly
   - Check user data is retrieved correctly

2. **Monitor Usage:**
   - Watch for any API errors
   - Check user login success rate
   - Monitor Facebook app dashboard

3. **Stay Compliant:**
   - Keep privacy policy updated
   - Respond to user data requests
   - Follow Facebook's platform policies

---

## Important Notes

### ⚠️ Critical Requirements:

**1. Privacy Policy MUST Include:**
- What data you collect from Facebook (email, name, profile picture)
- How you use this data (authentication, personalization)
- How long you keep it (30 days as per your policy)
- How users can delete their data (link to deletion page)
- How to contact you about privacy

**2. Terms of Service MUST Include:**
- Age requirements (13+ for Facebook, 18+ for Meedi8)
- Acceptable use policy
- Account termination conditions
- Limitation of liability

**3. Data Deletion Endpoint:**
Already configured: `https://meedi8.com/data-deletion`
- Must be functional
- Must actually delete user data when requested
- Must provide confirmation to user

**4. App Must Be Functional:**
- Website must be live
- OAuth login must work
- Can't be placeholder/coming soon page

---

## Troubleshooting

### "Can't find business in records"
- **Solution:** Use manual document upload instead of automatic verification

### "Documents rejected - name mismatch"
- **Solution:** Ensure EXACT name on all documents: "Meedi8 Ltd"

### "Address verification failed"
- **Solution:** Provide utility bill with clear business address visible

### "Phone verification failed"
- **Solution:** Use business landline instead of mobile if possible

### "Website doesn't meet requirements"
- **Solution:** 
  - Add clear privacy policy (link in footer)
  - Add terms of service
  - Remove any "coming soon" pages
  - Ensure site is fully functional

---

## Quick Reference Checklist

**Before Starting Verification:**
- [ ] Have Certificate of Incorporation ready
- [ ] Have recent utility bill/bank statement (last 3 months)
- [ ] Know your Company Number
- [ ] Have business phone number ready
- [ ] Business email is working
- [ ] Website is live with privacy policy & terms
- [ ] Privacy policy mentions Facebook data usage
- [ ] Data deletion page is functional

**During Verification:**
- [ ] Choose verification method (auto or manual)
- [ ] Fill out all business information accurately
- [ ] Upload all required documents (clear, complete, recent)
- [ ] Answer verification phone call
- [ ] Check email for Facebook updates

**After Verification:**
- [ ] Wait 2-7 days for review
- [ ] Check status daily in Facebook dashboard
- [ ] Respond immediately if more info requested
- [ ] Test OAuth login once approved

---

## Contact Info for Help

**If You Get Stuck:**

1. **Facebook Business Help Center**
   - https://www.facebook.com/business/help
   - Search: "Business verification"

2. **Facebook Developer Support**
   - https://developers.facebook.com/support/
   - Can submit support ticket if verification stuck

3. **Meedi8 Backend Team**
   - Adam has all credentials
   - App ID and Secret already configured in Railway

---

## Current Status Summary

**What's Done:**
- ✅ Facebook app created
- ✅ OAuth configured
- ✅ Credentials added to Railway
- ✅ App settings completed
- ✅ Redirect URIs configured

**What Chris Needs To Do:**
1. Gather business verification documents
2. Start verification process in Facebook Developer dashboard
3. Upload documents
4. Answer verification call
5. Wait for approval (2-7 days)

**Expected Result:**
- Business verified ✅
- App goes live ✅
- Users can log in with Facebook ✅
- Ready for production use ✅

---

## Timeline Estimate

**Day 1 (Today):**
- Gather all documents
- Start verification process
- Upload documents

**Day 2-8:**
- Facebook reviews
- May request additional info

**Day 9:**
- Verification approved (hopefully!)
- Test OAuth login
- Launch to users

**Total:** ~1-2 weeks including review time

---

## Questions?

If Chris has questions during the process:
- Check Facebook's help documentation first
- Screenshot any error messages
- Note which step caused the issue
- Contact Adam with specific question

Good luck! 🚀
