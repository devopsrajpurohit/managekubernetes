# Blog Image Guide

## Default Image

All blog posts use a **default image** (`/images/blog-default.svg`) when no custom image is specified. This ensures every blog post has a visual element.

## How to Add/Change Blog Images

Blog images can be easily managed through the markdown frontmatter or the Blog.jsx component.

### Method 1: Frontmatter (Recommended)

Add or update the `image` field in the blog post's frontmatter:

```yaml
---
title: Your Blog Post Title
description: Your description
date: 2024-12-15
category: Troubleshooting
image: /images/blog-your-image.svg  # Add your image path here
---
```

### Method 2: Blog Component

Update the `blogPosts` array in `src/pages/Blog.jsx`:

```javascript
{
  slug: 'your-blog-post',
  title: 'Your Blog Post Title',
  description: 'Description',
  date: '2024-12-15',
  readTime: '10 min read',
  category: 'Category',
  image: '/images/blog-your-image.svg'  // Add or update here
}
```

## Image Requirements

- **Format**: SVG (recommended) or PNG/JPG
- **Location**: Place images in `/public/images/` directory
- **Naming**: Use `blog-{slug}.svg` convention (e.g., `blog-getting-started.svg`)
- **Size**: Recommended 400x240px for optimal display
- **Path**: Always use absolute path starting with `/images/`

## Current Blog Images

| Blog Post | Image File | Status |
|-----------|-----------|--------|
| Getting Started with Kubernetes | `/images/blog-getting-started.svg` | ✅ |
| Troubleshooting Pods Pending | `/images/blog-pending-state.svg` | ✅ |
| Troubleshooting CrashLoopBackOff | `/images/blog-crashloopbackoff.svg` | ✅ |
| Troubleshooting Image Pull Errors | `/images/blog-image-pull.svg` | ✅ |
| Troubleshooting OOM Killed | `/images/blog-oom-killed.svg` | ✅ |
| Troubleshooting Evicted Pods | `/images/blog-evicted.svg` | ✅ |
| Troubleshooting Error State | `/images/blog-error-state.svg` | ✅ |
| Understanding Completed State | `/images/blog-completed-state.svg` | ✅ |
| Kubernetes Best Practices | `/images/blog-best-practices.svg` | ✅ |
| Debugging Applications | `/images/blog-debugging.svg` | ✅ |

## Default Image Behavior

- **No image specified**: Uses default image (`/images/blog-default.svg`)
- **Image fails to load**: Falls back to default image, then placeholder if default also fails
- **Custom image works**: Uses your specified image

## Changing the Default Image

To change the default blog image:
1. Replace `/public/images/blog-default.svg` with your new default image
2. Or update the path in `Blog.jsx` where it says `post.image || '/images/blog-default.svg'`

## Quick Update Steps

1. Add your image file to `/public/images/`
2. Update the `image` field in the blog post's frontmatter
3. Or update the `image` field in `Blog.jsx` for the blog listing
4. Images automatically appear in both the listing and the post

