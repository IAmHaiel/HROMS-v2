$base = "E:\Capstone Project\Capstone-1\HROMS\OTMS\wwwroot\uploads"

function New-PlaceholderPdf {
    param([string]$Path, [string]$Content)
    $pdf = "%PDF-1.4`n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj`n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj`nxref`n0 4`n0000000000 65535 f`n0000000009 00000 n`n0000000058 00000 n`n0000000115 00000 n`ntrailer<</Size 4/Root 1 0 R>>`nstartxref`n206`n%%EOF"
    Set-Content -Path $Path -Value $pdf -Encoding ASCII -NoNewline
}

# Employee attachments (20 files)
$empFiles = @(
    @{Num=1; Name="resume.pdf"; Title="Resume - Ricardo Cruz"},
    @{Num=2; Name="resume.pdf"; Title="Resume - Maria Reyes"},
    @{Num=3; Name="contract.pdf"; Title="Employment Contract - Jose Bautista"},
    @{Num=4; Name="resume.pdf"; Title="Resume - Ana Villanueva"},
    @{Num=5; Name="contract.pdf"; Title="Employment Contract - Carlos Dela Cruz"},
    @{Num=6; Name="nbi.pdf"; Title="NBI Clearance - Patricia Santos"},
    @{Num=7; Name="resume.pdf"; Title="Resume - Miguel Fernandez"},
    @{Num=8; Name="cert.pdf"; Title="Training Certificate - Cristina Morales"},
    @{Num=9; Name="resume.pdf"; Title="Resume - Roberto Tan"},
    @{Num=10; Name="contract.pdf"; Title="Employment Contract - Angela Gonzales"},
    @{Num=11; Name="resume.pdf"; Title="Resume - Fernando Herrera"},
    @{Num=12; Name="nbi.pdf"; Title="NBI Clearance - Lucia Pascual"},
    @{Num=13; Name="resume.pdf"; Title="Resume - Andres Soriano"},
    @{Num=14; Name="cert.pdf"; Title="Training Certificate - Isabella Mendoza"},
    @{Num=15; Name="resume.pdf"; Title="Resume - Marco Salvador"},
    @{Num=16; Name="contract.pdf"; Title="Employment Contract - Sofia Domingo"},
    @{Num=17; Name="resume.pdf"; Title="Resume - Diego Aguilar"},
    @{Num=18; Name="nbi.pdf"; Title="NBI Clearance - Carmela Vergara"},
    @{Num=19; Name="resume.pdf"; Title="Resume - Rafael Magno"},
    @{Num=20; Name="resume.pdf"; Title="Resume - Teresa Lagman"}
)

foreach ($f in $empFiles) {
    $dir = "$base\employees\emp{0:D3}" -f $f.Num
    $path = "$dir\$($f.Name)"
    New-PlaceholderPdf -Path $path -Content $f.Title
    Write-Output "Created: $path"
}

# Applicant documents (20 applicants)
$applicants = @(
    @{Id=1; LastName="Dizon"; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true},
    @{Id=2; LastName="Chua"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{Id=3; LastName="Rivera"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{Id=4; LastName="Garcia"; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true},
    @{Id=5; LastName="Aquino"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{Id=6; LastName="Fernandez"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false; Suffix="2"},
    @{Id=7; LastName="Salazar"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{Id=8; LastName="Pascual"; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true; Suffix="2"},
    @{Id=9; LastName="Medina"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{Id=10; LastName="Bueno"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{Id=11; LastName="Ortiz"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{Id=12; LastName="Vergara"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false; Suffix="2"},
    @{Id=13; LastName="Magno"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false; Suffix="2"},
    @{Id=14; LastName="Lagman"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{Id=15; LastName="Salvador"; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true; Suffix="2"},
    @{Id=16; LastName="Herrera"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false; Suffix="2"},
    @{Id=17; LastName="Pascual"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false; Suffix="3"},
    @{Id=18; LastName="Soriano"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false; Suffix="2"},
    @{Id=19; LastName="Mendoza"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false; Suffix="2"},
    @{Id=20; LastName="Domingo"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false; Suffix="2"}
)

$dir = "$base\applicants"
foreach ($a in $applicants) {
    $suffix = if ($a.Suffix) { $a.Suffix } else { "" }
    $lname = $a.LastName.ToLower()
    
    # Resume (always present)
    $resumePath = "$dir\resume_$lname$suffix.pdf"
    New-PlaceholderPdf -Path $resumePath -Content "Resume - $($a.LastName)"
    Write-Output "Created: $resumePath"
    
    # NBI Clearance
    if ($a.HasNBI) {
        $nbiPath = "$dir\nbi_$lname$suffix.pdf"
        New-PlaceholderPdf -Path $nbiPath -Content "NBI Clearance - $($a.LastName)"
        Write-Output "Created: $nbiPath"
    }
    
    # Medical Clearance
    if ($a.HasMed) {
        $medPath = "$dir\med_$lname$suffix.pdf"
        New-PlaceholderPdf -Path $medPath -Content "Medical Clearance - $($a.LastName)"
        Write-Output "Created: $medPath"
    }
    
    # PSA Birth Certificate
    if ($a.HasPSA) {
        $psaPath = "$dir\psa_$lname$suffix.pdf"
        New-PlaceholderPdf -Path $psaPath -Content "PSA Birth Certificate - $($a.LastName)"
        Write-Output "Created: $psaPath"
    }
    
    # BIR Form 2316
    if ($a.HasBIR) {
        $birPath = "$dir\bir_$lname$suffix.pdf"
        New-PlaceholderPdf -Path $birPath -Content "BIR Form 2316 - $($a.LastName)"
        Write-Output "Created: $birPath"
    }
}

Write-Output "`nAll placeholder files created successfully!"
Write-Output "Total files: $($empFiles.Count) employee + applicant documents"
