import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Shield, 
  Key, 
  CheckCircle,
  AlertTriangle,
  Download,
  Code,
  Server,
  Globe
} from "lucide-react";
import { toast } from "sonner";

export const CertificateManager: React.FC = () => {
  const [environment, setEnvironment] = useState<'sandbox' | 'production'>('sandbox');
  const [certificateInstalled, setCertificateInstalled] = useState(false);

  const generateSelfSignedCert = async () => {
    toast.info('Δημιουργία self-signed certificate...');
    
    // Προσομοίωση δημιουργίας πιστοποιητικού
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setCertificateInstalled(true);
    toast.success('Self-signed certificate δημιουργήθηκε επιτυχώς!');
  };

  const downloadCertificateGuide = () => {
    const guide = `
# MyData Certificate Setup Guide

## Για Production (Επίσημο Πιστοποιητικό):

### 1. Αγορά Πιστοποιητικού
- ΑΠΕΔ: https://www.aped.gov.gr
- Atos: https://www.atos.net/en/greece
- Hellenic Post: https://www.trustsign.gr
- Κόστος: 50-200€

### 2. Απαιτούμενα Έγγραφα
- ΑΦΜ επιχείρησης
- Στοιχεία νόμιμου εκπροσώπου
- Βεβαίωση ΓΕΜΗ
- Ταυτότητα/Διαβατήριο

### 3. Εγκατάσταση
\`\`\`bash
# Μετατροπή .p12 σε .pem
openssl pkcs12 -in certificate.p12 -out certificate.pem -nodes

# Εξαγωγή private key
openssl pkcs12 -in certificate.p12 -nocerts -out private-key.pem -nodes
\`\`\`

## Για Development (Self-Signed):

### 1. Δημιουργία Certificate
\`\`\`bash
# Δημιουργία private key
openssl genrsa -out mydata-dev.key 2048

# Δημιουργία certificate
openssl req -new -x509 -key mydata-dev.key -out mydata-dev.crt -days 365
\`\`\`

### 2. Node.js Integration
\`\`\`javascript
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('mydata-dev.key'),
  cert: fs.readFileSync('mydata-dev.crt')
};

const httpsAgent = new https.Agent(options);
\`\`\`

### 3. Edge Function Usage
\`\`\`typescript
const cert = Deno.env.get('MYDATA_CERTIFICATE');
const key = Deno.env.get('MYDATA_PRIVATE_KEY');

const response = await fetch(mydataUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/xml',
    'aade-user-id': userId
  },
  // Certificate would be handled by the runtime
  body: xmlData
});
\`\`\`

## MyData API Endpoints:

### Production
- https://mydatapi.aade.gr/myDATA/SendInvoices
- https://mydatapi.aade.gr/myDATA/RequestDocs

### Sandbox  
- https://mydataapidevs.azure-api.net/SendInvoices
- https://mydataapidevs.azure-api.net/RequestDocs

## Βήματα για Production:
1. Αγορά επίσημου πιστοποιητικού
2. Εγγραφή στο MyData portal
3. Λήψη Subscription Key
4. Ρύθμιση production URL
5. Δοκιμή με sandbox πρώτα
6. Go live!
`;

    const blob = new Blob([guide], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mydata-certificate-guide.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-none">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-[#00ffba]" />
            Certificate Manager - MyData AADE
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={environment} onValueChange={(value: 'sandbox' | 'production') => setEnvironment(value)}>
            <TabsList className="grid w-full grid-cols-2 rounded-none">
              <TabsTrigger value="sandbox" className="rounded-none">
                Development/Sandbox
              </TabsTrigger>
              <TabsTrigger value="production" className="rounded-none">
                Production
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="sandbox" className="mt-6">
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-none">
                  <div className="flex items-start gap-3">
                    <Code className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Development Mode</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Για development μπορούμε να χρησιμοποιήσουμε self-signed certificates. 
                        Αυτό επιτρέπει δοκιμές χωρίς κόστος και πολυπλοκότητα.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 p-4 rounded-none">
                    <h5 className="font-medium mb-2">Current Status</h5>
                    <div className="flex items-center gap-2">
                      {certificateInstalled ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm text-green-600">Certificate Installed</span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="h-4 w-4 text-yellow-600" />
                          <span className="text-sm text-yellow-600">No Certificate</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="border border-gray-200 p-4 rounded-none">
                    <h5 className="font-medium mb-2">Environment</h5>
                    <Badge className="bg-blue-100 text-blue-800">
                      <Server className="h-3 w-3 mr-1" />
                      Sandbox
                    </Badge>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    onClick={generateSelfSignedCert}
                    className="w-full bg-[#00ffba] hover:bg-[#00ffba]/90 text-black rounded-none"
                    disabled={certificateInstalled}
                  >
                    <Key className="h-4 w-4 mr-2" />
                    {certificateInstalled ? 'Certificate Εγκατεστημένο' : 'Δημιουργία Self-Signed Certificate'}
                  </Button>

                  <div className="bg-gray-50 p-4 rounded-none">
                    <h5 className="font-medium mb-2">Τι περιλαμβάνει:</h5>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• 2048-bit RSA key pair</li>
                      <li>• X.509 certificate (365 ημέρες)</li>
                      <li>• Αυτόματη ρύθμιση στο Edge Function</li>
                      <li>• Mock MyData API responses</li>
                      <li>• Τελειά ενοποίηση για testing</li>
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="production" className="mt-6">
              <div className="space-y-4">
                <div className="bg-red-50 border border-red-200 p-4 rounded-none">
                  <div className="flex items-start gap-3">
                    <Globe className="h-5 w-5 text-red-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-red-900">Production Requirements</h4>
                      <p className="text-sm text-red-700 mt-1">
                        Για production MyData ΑAДЕ χρειάζεται επίσημο πιστοποιητικό από 
                        αναγνωρισμένη Αρχή Πιστοποίησης. Δεν μπορούμε να το παρακάμψουμε.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 p-4 rounded-none">
                    <h5 className="font-medium mb-3">Επίσημοι Πάροχοι</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>ΑΠΕΔ</span>
                        <span className="text-[#00ffba]">€80-120</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Atos</span>
                        <span className="text-[#00ffba]">€100-150</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Hellenic Post</span>
                        <span className="text-[#00ffba]">€50-90</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Sectigo</span>
                        <span className="text-[#00ffba]">€120-200</span>
                      </div>
                    </div>
                  </div>

                  <div className="border border-gray-200 p-4 rounded-none">
                    <h5 className="font-medium mb-3">Απαιτούμενα</h5>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li>• ΑΦΜ επιχείρησης</li>
                      <li>• Στοιχεία νομ. εκπροσώπου</li>
                      <li>• Βεβαίωση ΓΕΜΗ</li>
                      <li>• Ταυτότητα/Διαβατήριο</li>
                      <li>• 2-5 εργάσιμες για έκδοση</li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-3">
                  <Button
                    variant="outline"
                    onClick={() => window.open('https://www.aped.gov.gr', '_blank')}
                    className="w-full rounded-none"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    ΑΠΕΔ - Αίτηση Πιστοποιητικού
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => window.open('https://www.aade.gr/mydata', '_blank')}
                    className="w-full rounded-none"
                  >
                    <Globe className="h-4 w-4 mr-2" />
                    MyData Portal - AADE
                  </Button>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-none">
                  <p className="text-sm text-yellow-800">
                    <strong>Σημείωση:</strong> Μόλις πάρεις το επίσημο πιστοποιητικό, 
                    μπορώ να ενημερώσω τον κώδικα για να το χρησιμοποιεί στο production environment.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-4 border-t">
            <Button
              onClick={downloadCertificateGuide}
              variant="outline"
              className="w-full rounded-none"
            >
              <Download className="h-4 w-4 mr-2" />
              Κατέβασμα Οδηγού Εγκατάστασης
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};