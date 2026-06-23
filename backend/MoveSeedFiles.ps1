$base = "E:\Capstone Project\Capstone-1\HROMS\OTMS\wwwroot\uploads"

function New-PlaceholderPdf {
    param([string]$Path, [string]$Content)
    $pdf = "%PDF-1.4`n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj`n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj`n3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj`nxref`n0 4`n0000000000 65535 f`n0000000009 00000 n`n0000000058 00000 n`n0000000115 00000 n`ntrailer<</Size 4/Root 1 0 R>>`nstartxref`n206`n%%EOF"
    Set-Content -Path $Path -Value $pdf -Encoding ASCII -NoNewline
}

Write-Output "Creating employee attachment files in /uploads/attachments/..."
$attachmentsDir = "$base\attachments"
if (!(Test-Path $attachmentsDir)) { New-Item -ItemType Directory -Path $attachmentsDir -Force | Out-Null }

$empFiles = @(
    @{Num=1; Name="resume_cruz_r.pdf"; Title="Resume - Ricardo Cruz"},
    @{Num=2; Name="resume_reyes_m.pdf"; Title="Resume - Maria Reyes"},
    @{Num=3; Name="contract_bautista.pdf"; Title="Employment Contract - Jose Bautista"},
    @{Num=4; Name="resume_villanueva.pdf"; Title="Resume - Ana Villanueva"},
    @{Num=5; Name="contract_delacruz.pdf"; Title="Employment Contract - Carlos Dela Cruz"},
    @{Num=6; Name="nbi_santos_p.pdf"; Title="NBI Clearance - Patricia Santos"},
    @{Num=7; Name="resume_fernandez.pdf"; Title="Resume - Miguel Fernandez"},
    @{Num=8; Name="cert_morales_c.pdf"; Title="Training Certificate - Cristina Morales"},
    @{Num=9; Name="resume_tan_r.pdf"; Title="Resume - Roberto Tan"},
    @{Num=10; Name="contract_gonzales.pdf"; Title="Employment Contract - Angela Gonzales"},
    @{Num=11; Name="resume_herrera_f.pdf"; Title="Resume - Fernando Herrera"},
    @{Num=12; Name="nbi_pascual_l.pdf"; Title="NBI Clearance - Lucia Pascual"},
    @{Num=13; Name="resume_soriano_a.pdf"; Title="Resume - Andres Soriano"},
    @{Num=14; Name="cert_mendoza_i.pdf"; Title="Training Certificate - Isabella Mendoza"},
    @{Num=15; Name="resume_salvador_m.pdf"; Title="Resume - Marco Salvador"},
    @{Num=16; Name="contract_domingo.pdf"; Title="Employment Contract - Sofia Domingo"},
    @{Num=17; Name="resume_aguilar_d.pdf"; Title="Resume - Diego Aguilar"},
    @{Num=18; Name="nbi_vergara_c.pdf"; Title="NBI Clearance - Carmela Vergara"},
    @{Num=19; Name="resume_magno_r.pdf"; Title="Resume - Rafael Magno"},
    @{Num=20; Name="resume_lagman_t.pdf"; Title="Resume - Teresa Lagman"}
)

foreach ($f in $empFiles) {
    $guid = "a1b2c3d4-e5f6-7890-abcd-ef12345678{0:D2}" -f $f.Num
    $fileName = "{0}_{1}" -f $guid, $f.Name
    $path = "$attachmentsDir\$fileName"
    New-PlaceholderPdf -Path $path -Content $f.Title
    Write-Output "Created: $fileName"
}

Write-Output "`nCreating applicant resume files in /uploads/resumes/..."
$resumesDir = "$base\resumes"
if (!(Test-Path $resumesDir)) { New-Item -ItemType Directory -Path $resumesDir -Force | Out-Null }

$applicants = @(
    @{Id=1; LastName="Dizon"; Suffix=""},
    @{Id=2; LastName="Chua"; Suffix=""},
    @{Id=3; LastName="Rivera"; Suffix=""},
    @{Id=4; LastName="Garcia"; Suffix=""},
    @{Id=5; LastName="Aquino"; Suffix=""},
    @{Id=6; LastName="Fernandez"; Suffix="2"},
    @{Id=7; LastName="Salazar"; Suffix=""},
    @{Id=8; LastName="Pascual"; Suffix="2"},
    @{Id=9; LastName="Medina"; Suffix=""},
    @{Id=10; LastName="Bueno"; Suffix=""},
    @{Id=11; LastName="Ortiz"; Suffix=""},
    @{Id=12; LastName="Vergara"; Suffix="2"},
    @{Id=13; LastName="Magno"; Suffix="2"},
    @{Id=14; LastName="Lagman"; Suffix=""},
    @{Id=15; LastName="Salvador"; Suffix="2"},
    @{Id=16; LastName="Herrera"; Suffix="2"},
    @{Id=17; LastName="Pascual"; Suffix="3"},
    @{Id=18; LastName="Soriano"; Suffix="2"},
    @{Id=19; LastName="Mendoza"; Suffix="2"},
    @{Id=20; LastName="Domingo"; Suffix="2"}
)

foreach ($a in $applicants) {
    $lname = $a.LastName.ToLower()
    $resumeName = "resume_$lname$($a.Suffix).pdf"
    $path = "$resumesDir\$resumeName"
    New-PlaceholderPdf -Path $path -Content "Resume - $($a.LastName)"
    Write-Output "Created: $resumeName"
}

Write-Output "`nCreating applicant clearance documents in /uploads/applicant-docs/..."
$clearanceDir = "$base\applicant-docs"
if (!(Test-Path $clearanceDir)) { New-Item -ItemType Directory -Path $clearanceDir -Force | Out-Null }

$clearanceDocs = @(
    @{LastName="Dizon"; Suffix=""; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true},
    @{LastName="Chua"; Suffix=""; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Rivera"; Suffix=""; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{LastName="Garcia"; Suffix=""; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true},
    @{LastName="Aquino"; Suffix=""; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Fernandez"; Suffix="2"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{LastName="Salazar"; Suffix=""; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Pascual"; Suffix="2"; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true},
    @{LastName="Medina"; Suffix=""; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Bueno"; Suffix=""; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{LastName="Ortiz"; Suffix=""; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Vergara"; Suffix="2"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{LastName="Magno"; Suffix="2"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Lagman"; Suffix=""; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{LastName="Salvador"; Suffix="2"; HasNBI=$true; HasMed=$true; HasPSA=$true; HasBIR=$true},
    @{LastName="Herrera"; Suffix="2"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Pascual"; Suffix="3"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{LastName="Soriano"; Suffix="2"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false},
    @{LastName="Mendoza"; Suffix="2"; HasNBI=$true; HasMed=$true; HasPSA=$false; HasBIR=$false},
    @{LastName="Domingo"; Suffix="2"; HasNBI=$true; HasMed=$false; HasPSA=$false; HasBIR=$false}
)

foreach ($doc in $clearanceDocs) {
    $lname = $doc.LastName.ToLower()
    
    if ($doc.HasNBI) {
        $nbiName = "nbi_$lname$($doc.Suffix).pdf"
        $path = "$clearanceDir\$nbiName"
        New-PlaceholderPdf -Path $path -Content "NBI Clearance - $($doc.LastName)"
        Write-Output "Created: $nbiName"
    }
    
    if ($doc.HasMed) {
        $medName = "med_$lname$($doc.Suffix).pdf"
        $path = "$clearanceDir\$medName"
        New-PlaceholderPdf -Path $path -Content "Medical Clearance - $($doc.LastName)"
        Write-Output "Created: $medName"
    }
    
    if ($doc.HasPSA) {
        $psaName = "psa_$lname$($doc.Suffix).pdf"
        $path = "$clearanceDir\$psaName"
        New-PlaceholderPdf -Path $path -Content "PSA Birth Certificate - $($doc.LastName)"
        Write-Output "Created: $psaName"
    }
    
    if ($doc.HasBIR) {
        $birName = "bir_$lname$($doc.Suffix).pdf"
        $path = "$clearanceDir\$birName"
        New-PlaceholderPdf -Path $path -Content "BIR Form 2316 - $($doc.LastName)"
        Write-Output "Created: $birName"
    }
}

Write-Output "`nCleaning up old directories..."
$oldEmpDir = "$base\employees"
$oldAppDir = "$base\applicants"

if (Test-Path $oldEmpDir) {
    Remove-Item -Path $oldEmpDir -Recurse -Force
    Write-Output "Removed: $oldEmpDir"
}

if (Test-Path $oldAppDir) {
    Remove-Item -Path $oldAppDir -Recurse -Force
    Write-Output "Removed: $oldAppDir"
}

Write-Output "`nAll files moved to correct locations!"
Write-Output "Summary:"
Write-Output "  - Employee attachments: $attachmentsDir (20 files with GUID prefix)"
Write-Output "  - Applicant resumes: $resumesDir (20 files)"
Write-Output "  - Applicant clearances: $clearanceDir (NBI, Medical, PSA, BIR docs)"
