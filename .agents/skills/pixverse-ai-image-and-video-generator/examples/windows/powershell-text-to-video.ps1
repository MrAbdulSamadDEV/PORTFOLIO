# PixVerse CLI — Full Video Production Pipeline (PowerShell)
#
# This script demonstrates a complete cinematic video pipeline:
#   1. Generate a base image (T2I)
#   2. Animate the image into a 12-second video using Sora 2 (I2V)
#   3. Upscale to 2160p
#   4. Download the final video
#
# Prerequisites:
#   - Node.js >= 20
#   - npm install -g pixverse
#   - pixverse auth login --json

$ImagePrompt = "Ultra-realistic cinematic scene of a brutal historical battlefield, medieval warriors clashing with steel swords and heavy shields, mud, flying blood, dark storm clouds, fire burning in the background, epic scale, dense atmosphere, 9:16"
$AnimationPrompt = "Cinematic trailer style, fast-paced action, dynamic camera movement, chaotic battlefield, hyper-realistic physics, aggressive motion"

Write-Host "Starting Cinematic Pipeline (Sora 2 - 12 Seconds)..." -ForegroundColor Cyan

Write-Host "1. Generating base image (9:16)..." -ForegroundColor Yellow
$ImgOutput = pixverse create image --prompt $ImagePrompt --aspect-ratio 9:16 --json | Out-String | ConvertFrom-Json
$ImageUrl = $ImgOutput.image_url

Write-Host "2. Animating the scene (Sora 2, 12 seconds)..." -ForegroundColor Yellow
$VidOutput = pixverse create video --image $ImageUrl --prompt $AnimationPrompt --model sora-2 --duration 12 --json | Out-String | ConvertFrom-Json
$VideoId = $VidOutput.video_id
pixverse task wait $VideoId

Write-Host "3. Upscaling to high fidelity..." -ForegroundColor Yellow
$UpscaleOutput = pixverse create upscale --video $VideoId --quality 2160p --json | Out-String | ConvertFrom-Json
$FinalId = $UpscaleOutput.video_id
pixverse task wait $FinalId

Write-Host "4. Downloading the mastered trailer..." -ForegroundColor Yellow
pixverse asset download $FinalId --type video

Write-Host "Done! The 12-second epic cut is saved to your current folder." -ForegroundColor Green
