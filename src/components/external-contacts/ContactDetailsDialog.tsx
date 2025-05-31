"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExternalContact, ContactStatus, ContactType } from "@/types/external-contacts";
import { useUpdateLastContacted } from "@/hooks/useExternalContacts";

interface ContactDetailsDialogProps {
  contact: ExternalContact;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactDetailsDialog({ contact, open, onOpenChange }: ContactDetailsDialogProps) {
  const updateLastContacted = useUpdateLastContacted();

  const getStatusColor = (status: ContactStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'blacklisted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeColor = (type: ContactType) => {
    switch (type) {
      case 'contractor': return 'bg-blue-100 text-blue-800';
      case 'vendor': return 'bg-purple-100 text-purple-800';
      case 'service_provider': return 'bg-orange-100 text-orange-800';
      case 'supplier': return 'bg-teal-100 text-teal-800';
      case 'other': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">No rating</span>;
    
    return (
      <div className="flex items-center">
        {[1, 2, 3, 4, 5].map((star) => (
          <i
            key={star}
            className={`ri-star-${star <= rating ? 'fill' : 'line'} text-yellow-400`}
          />
        ))}
        <span className="ml-1 text-sm text-gray-600">({rating}/5)</span>
      </div>
    );
  };

  const handleContact = async (method: 'email' | 'phone' | 'mobile' | 'website') => {
    // Update last contacted date
    await updateLastContacted.mutateAsync(contact.id);
    
    // Open appropriate contact method
    if (method === 'email' && contact.email) {
      window.open(`mailto:${contact.email}`);
    } else if (method === 'phone' && contact.phone) {
      window.open(`tel:${contact.phone}`);
    } else if (method === 'mobile' && contact.mobile) {
      window.open(`tel:${contact.mobile}`);
    } else if (method === 'website' && contact.website) {
      window.open(contact.website, '_blank');
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl">{contact.company_name}</DialogTitle>
              {contact.contact_person && (
                <DialogDescription className="text-lg mt-1">
                  Contact: {contact.contact_person}
                </DialogDescription>
              )}
            </div>
            {contact.emergency_contact && (
              <Badge variant="destructive" className="ml-2">
                <i className="ri-alarm-warning-line mr-1"></i>
                Emergency Contact
              </Badge>
            )}
          </div>
          
          <div className="flex gap-2 mt-4">
            <Badge className={getTypeColor(contact.type)}>
              {contact.type.replace('_', ' ')}
            </Badge>
            <Badge className={getStatusColor(contact.status)}>
              {contact.status}
            </Badge>
            {contact.category && (
              <Badge variant="outline">
                {contact.category.replace('_', ' ')}
              </Badge>
            )}
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {contact.email && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="ri-mail-line mr-2 text-muted-foreground"></i>
                    <span>{contact.email}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleContact('email')}
                  >
                    <i className="ri-mail-line"></i>
                  </Button>
                </div>
              )}
              
              {contact.phone && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="ri-phone-line mr-2 text-muted-foreground"></i>
                    <span>{contact.phone}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleContact('phone')}
                  >
                    <i className="ri-phone-line"></i>
                  </Button>
                </div>
              )}
              
              {contact.mobile && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="ri-smartphone-line mr-2 text-muted-foreground"></i>
                    <span>{contact.mobile}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleContact('mobile')}
                  >
                    <i className="ri-smartphone-line"></i>
                  </Button>
                </div>
              )}
              
              {contact.fax && (
                <div className="flex items-center">
                  <i className="ri-printer-line mr-2 text-muted-foreground"></i>
                  <span>{contact.fax}</span>
                </div>
              )}
              
              {contact.website && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <i className="ri-global-line mr-2 text-muted-foreground"></i>
                    <span className="truncate">{contact.website}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => handleContact('website')}
                  >
                    <i className="ri-external-link-line"></i>
                  </Button>
                </div>
              )}

              {contact.preferred_contact_method && (
                <div className="flex items-center">
                  <i className="ri-heart-line mr-2 text-muted-foreground"></i>
                  <span>Prefers: {contact.preferred_contact_method}</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Address Information */}
          {(contact.address_line1 || contact.city || contact.state) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Address</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {contact.address_line1 && <div>{contact.address_line1}</div>}
                  {contact.address_line2 && <div>{contact.address_line2}</div>}
                  {(contact.city || contact.state || contact.zip_code) && (
                    <div>
                      {contact.city && contact.city}
                      {contact.city && contact.state && ', '}
                      {contact.state && contact.state}
                      {contact.zip_code && ` ${contact.zip_code}`}
                    </div>
                  )}
                  {contact.country && contact.country !== 'United States' && (
                    <div>{contact.country}</div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Business Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.license_number && (
                <div className="flex items-center">
                  <i className="ri-award-line mr-2 text-muted-foreground"></i>
                  <span>License: {contact.license_number}</span>
                </div>
              )}
              
              {contact.tax_id && (
                <div className="flex items-center">
                  <i className="ri-file-text-line mr-2 text-muted-foreground"></i>
                  <span>Tax ID: {contact.tax_id}</span>
                </div>
              )}
              
              {contact.business_hours && (
                <div className="flex items-center">
                  <i className="ri-time-line mr-2 text-muted-foreground"></i>
                  <span>{contact.business_hours}</span>
                </div>
              )}

              <div className="flex items-center">
                <i className="ri-calendar-line mr-2 text-muted-foreground"></i>
                <span>Last contacted: {formatDate(contact.last_contacted)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Pricing Information */}
          {(contact.hourly_rate || contact.emergency_rate || contact.minimum_charge) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {contact.hourly_rate && (
                  <div className="flex items-center">
                    <i className="ri-money-dollar-circle-line mr-2 text-muted-foreground"></i>
                    <span>Hourly Rate: ${contact.hourly_rate}</span>
                  </div>
                )}
                
                {contact.emergency_rate && (
                  <div className="flex items-center">
                    <i className="ri-alarm-warning-line mr-2 text-muted-foreground"></i>
                    <span>Emergency Rate: ${contact.emergency_rate}</span>
                  </div>
                )}
                
                {contact.minimum_charge && (
                  <div className="flex items-center">
                    <i className="ri-price-tag-3-line mr-2 text-muted-foreground"></i>
                    <span>Minimum Charge: ${contact.minimum_charge}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Services Offered */}
          {contact.services_offered && contact.services_offered.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Services Offered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {contact.services_offered.map((service) => (
                    <Badge key={service} variant="secondary">
                      {service}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Rating */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Rating</CardTitle>
            </CardHeader>
            <CardContent>
              {renderStars(contact.rating)}
            </CardContent>
          </Card>

          {/* Emergency Information */}
          {contact.emergency_contact && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg text-red-600">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-red-600">
                    <i className="ri-alarm-warning-line mr-2"></i>
                    <span>Available 24/7 for emergencies</span>
                  </div>
                  {contact.emergency_phone && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <i className="ri-phone-line mr-2 text-muted-foreground"></i>
                        <span>Emergency: {contact.emergency_phone}</span>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => window.open(`tel:${contact.emergency_phone}`)}
                      >
                        <i className="ri-phone-line"></i>
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {contact.notes && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{contact.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Insurance Information */}
          {contact.insurance_info && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg">Insurance Information</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{contact.insurance_info}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
